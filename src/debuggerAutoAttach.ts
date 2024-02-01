import * as vscode from 'vscode';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { isHostReachable } from './connectionUtils';
import { ConfigManager } from './configManager';
import { Logger } from './logger';

const DEBUG_SESSION_START_TIMEOUT = 5000 // 5 seconds
const MESSAGE_PREFIX = 'Debugger Auto Attach:'

export class DebuggerAutoAttach {
    private static logger: Logger = new Logger()
    private static statusBarItem: vscode.StatusBarItem;
    private static config: ConfigManager;
    private static context: vscode.ExtensionContext;
    private static debugConfig: vscode.DebugConfiguration

    public static activate(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = new ConfigManager(context)

        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'debugger-auto-attach.showOptionsMenu';
        this.statusBarItem.show();

        this.registerCommands();
        this.setupDebugSessionEventListeners();
        this.loadLaunchConfigFile();
    }

    private static registerCommands() {
        const commands = [
            vscode.commands.registerCommand('debugger-auto-attach.setTimeout', () => this.setTimeoutValue()),
            vscode.commands.registerCommand('debugger-auto-attach.setRetryInterval', () => this.setRetryInterval()),
            vscode.commands.registerCommand('debugger-auto-attach.selectLaunchConfig', () => this.promptForLaunchConfig()),
            vscode.commands.registerCommand('debugger-auto-attach.toggleAutoAttach', () => this.toggleAutoAttach()),
            vscode.commands.registerCommand('debugger-auto-attach.restartAutoAttach', () => this.restartAutoAttach(false)),
            vscode.commands.registerCommand('debugger-auto-attach.showOptionsMenu', () => this.showOptionsMenu()),
        ];
        commands.forEach(command => this.context.subscriptions.push(command));
    }

    private static loadLaunchConfigFile() {
        this.setStatusBarText('Loading debug launch config...');

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            this.showWarningMessage('Please open a folder to set a launch configuration.');
            return;
        }

        // Retrieve the path from your configuration manager
        let launchConfigPath = this.config.launchConfigFile;

        // Check if the path is absolute. If not, construct the path relative to the workspace
        if (!path.isAbsolute(launchConfigPath)) {
            const workspacePath = workspaceFolders[0].uri.fsPath;
            launchConfigPath = path.join(workspacePath, '.vscode', launchConfigPath);
        }

        // Now launchConfigPath is guaranteed to be an absolute path
        this.readLaunchConfig(launchConfigPath);
    }

    private static async setTimeoutValue() {
        const newTimeout = await vscode.window.showInputBox({
            prompt: 'Enter new timeout value in milliseconds (e.g., 30000 for 30 seconds)',
            validateInput: (input) => isNaN(parseInt(input, 10)) || parseInt(input, 10) <= 0 ? 'Please enter a positive number.' : null,
        });
        if (newTimeout !== undefined) {
            const debugSessionStartTimeout = parseInt(newTimeout, 10);
            this.config.setDebugSessionStartTimeout(debugSessionStartTimeout)
            this.showInformationMessage(`Timeout updated to ${newTimeout} milliseconds.`);
        }
    }

    private static async setRetryInterval() {
        const newRetryInterval = await vscode.window.showInputBox({
            prompt: 'Enter new retry interval value in milliseconds (e.g., 500 for 1/2 second)',
            validateInput: (input) => isNaN(parseInt(input, 10)) || parseInt(input, 10) <= 0 ? 'Please enter a positive number.' : null,
        });
        if (newRetryInterval !== undefined) {
            const retryInterval = parseInt(newRetryInterval, 10);
            this.config.setRetryInterval(retryInterval)
            this.showInformationMessage(`Retry interval updated to ${newRetryInterval} milliseconds.`);
        }
    }

    private static async promptForLaunchConfig() {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select',
            filters: { 'JSON Files': ['json'] },
        });
        if (fileUri && fileUri[0]) {
            const selectedFilePath = fileUri[0].fsPath;
            this.config.setLaunchConfigFile(selectedFilePath)
            this.readLaunchConfig(selectedFilePath);
            this.showInformationMessage(`Launch configuration updated: ${selectedFilePath}`);
        } else {
            this.showWarningMessage(`No launch configuration file selected. Using ${this.config.launchConfigFile}`);
        }
    }

    private static restartAutoAttach(checkHost: boolean = false) {
        if (this.debugConfig) {
            this.config.setIsAutoAttachEnabled(true)
            this.tryStartDebugging(this.config.debugSessionStartTimeout, checkHost);
        } else {
            this.showErrorMessage('No suitable debug configuration found. Please set Launch Configuration.');
        }
    }

    private static toggleAutoAttach() {
        const isAutoAttachEnabled = !this.config.isAutoAttachEnabled
        this.config.setIsAutoAttachEnabled(isAutoAttachEnabled)
        if (isAutoAttachEnabled) {
            this.restartAutoAttach(true);
        } else {
            this.setStatusBarText('Disabled');
        }
    }

    private static showOptionsMenu() {
        const autoAttachOption = `${this.config.isAutoAttachEnabled ? 'Disable' : 'Enable'} Auto-Attach`;
        const options = ['Restart Auto-Attach', autoAttachOption, 'Set Timeout', 'Set Retry Interval', 'Select Launch Configuration'];
        vscode.window.showQuickPick(options, {
            placeHolder: 'Choose an action',
        }).then((selection) => {
            switch (selection) {
                case 'Restart Auto-Attach':
                    this.restartAutoAttach();
                    break;
                case autoAttachOption:
                    this.toggleAutoAttach();
                    break;
                case 'Set Timeout':
                    this.setTimeoutValue();
                    break;
                case 'Set Retry Interval':
                    this.setRetryInterval();
                    break;
                case 'Select Launch Configuration':
                    this.promptForLaunchConfig();
                    break;
            }
        });
    }

    private static setStatusBarText(text: string) {
        this.statusBarItem.text = `${MESSAGE_PREFIX} ${text}`.trim();
    }

    private static showInformationMessage(message: string) {
        vscode.window.showInformationMessage(`${MESSAGE_PREFIX} ${message}`);
    }

    private static showWarningMessage(message: string) {
        vscode.window.showWarningMessage(`${MESSAGE_PREFIX} ${message}`);
    }

    private static showErrorMessage(message: string) {
        vscode.window.showErrorMessage(`${MESSAGE_PREFIX} ${message}`);
    }

    private static isValidDebugConfig(cfg: { [index: string]: any }): boolean {
        const requiredKeys = ['type', 'name', 'request']
        const configKeys = Object.keys(cfg)

        return requiredKeys.every(key => configKeys.includes(key));
    }

    private static async readLaunchConfig(launchConfigPath: string) {
        try {
            const data = await fsPromises.readFile(launchConfigPath, 'utf8');
            const config = JSON.parse(data);

            const validConfig = config.configurations.find(this.isValidDebugConfig);
            if (validConfig) {
                this.debugConfig = validConfig;
                this.config.setLaunchConfigFile(launchConfigPath);
                this.tryStartDebugging(this.config.debugSessionStartTimeout);
            } else {
                this.showErrorMessage('No suitable debug configuration found in launch.json.');
            }
        } catch (error) {
            this.handleReadConfigError(error, launchConfigPath);
        }
    }

    private static setupDebugSessionEventListeners() {
        vscode.debug.onDidChangeActiveDebugSession((e) => {
            if (!e) {
                this.logger.log('Connection to debugger lost. Attempting to reconnect');
                this.setStatusBarText('Connection to debugger lost. Attempting to reconnect...')
                this.tryStartDebugging(this.config.autoRestartTimeout);
            }else{
                this.setStatusBarText('Attached')
            }
        });
    }

    private static handleReadConfigError(error: any, launchConfigPath: string) {
        if (error.code === 'ENOENT') {
            this.showErrorMessage(`Failed to read ${launchConfigPath}. Please select a valid config file`);
            this.setStatusBarText('Setup')
        } else {
            this.showErrorMessage('Invalid JSON in launch.json file.');
        }
    }

    private static async tryStartDebugging(timeout: number, checkHost = true): Promise<boolean> {
        if (!this.config.isAutoAttachEnabled) {
            this.setStatusBarText('Disabled');
            return false;
        }

        if (vscode.debug.activeDebugSession) {
            this.logger.log("Debugging session is already active.");
            this.setStatusBarText('Attached');
            return false;
        }

        return this.initiateDebugging(timeout, checkHost);
    }

    private static async isDAPServerReachable(): Promise<boolean> {
        const debugHost = this.debugConfig.host || 'localhost';
        const debugPort = +(this.debugConfig.port || 9229);
        const isReachable = await isHostReachable(debugHost, debugPort);

        if (!isReachable) {
            const debugServerLocation = `${debugHost}:${debugPort}`;
            this.logger.log(`Host ${debugServerLocation} is not reachable. Unable to attach debugger.`);
            this.setStatusBarText(`${debugServerLocation} is not reachable`);
        }

        return isReachable;
    }

    private static async initiateDebugging(timeout: number, checkHost = true): Promise<boolean> {
        if (checkHost && !(await this.isDAPServerReachable())) {
            return false;
        }
    
        this.setStatusBarText(`Attempting to attach for ${timeout}ms`);
    
        // Define the start time outside the promise for overall timeout tracking
        const startTime = Date.now();
        let debugSessionTimeoutReached = false; // Flag to indicate if the session start timeout has been reached
    
        // Set a timeout to mark the debug session start timeout as reached
        const debugSessionTimeoutId = setTimeout(() => {
            debugSessionTimeoutReached = true;
            vscode.debug.stopDebugging(); // Attempt to stop any ongoing debugging process
            this.showErrorMessage('Unable to start debugging session. Please restart your debug server to clear out any open connection attempts and try again');
            this.setStatusBarText('Unable to Attach');
        }, DEBUG_SESSION_START_TIMEOUT);
    
        return new Promise<boolean>((resolve) => {
            const attemptDebugging = async () => {
                // Check conditions to continue or stop trying to debug
                if (vscode.debug.activeDebugSession) {
                    clearTimeout(debugSessionTimeoutId);
                    this.logger.log("Debugging session is already active.");
                    this.setStatusBarText('Attached');
                    resolve(true);
                    return;
                }
    
                if (debugSessionTimeoutReached) {
                    resolve(false);
                    return;
                }
    
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime >= timeout) {
                    clearTimeout(debugSessionTimeoutId);
                    this.logger.log("Overall timeout reached, unable to start debugging session.");
                    this.setStatusBarText('Unable to Attach');
                    resolve(false);
                    return;
                }
    
                // Attempt to start debugging
                const success = await vscode.debug.startDebugging(undefined, this.debugConfig);
                if (success) {
                    clearTimeout(debugSessionTimeoutId);
                    this.logger.log("Debugging session started successfully.");
                    this.setStatusBarText('Attached');
                    resolve(true);
                } else {
                    // If not successful, wait for the retry interval and then retry
                    setTimeout(attemptDebugging, this.config.retryInterval);
                }
            };
    
            // Initial call to attempt debugging
            attemptDebugging();
        });
    }
        
}