import * as vscode from 'vscode'

export interface ConfigOptions {
    launchConfigFile: string;
    isAutoAttachEnabled: boolean;
    debugSessionStartTimeout: number;
    autoRestartTimeout: number;
    retryInterval: number;
}

const LAUNCH_CONFIG_FILE = 'launch.json'
const IS_AUTO_ATTACH_ENABLED = true
const DEBUG_SESSION_START_TIMEOUT = 30 * 1000 // 30 Seconds
const AUTO_RESTART_TIMEOUT = 5 * 1000 // 5 Seconds
const RETRY_INTERVAL = 500 // 1/2 a Second

const DEFAULTS = {
    LAUNCH_CONFIG_FILE,
    IS_AUTO_ATTACH_ENABLED,
    DEBUG_SESSION_START_TIMEOUT,
    AUTO_RESTART_TIMEOUT,
    RETRY_INTERVAL
}

const STATE_KEYS = {
    LAUNCH_CONFIG_FILE: 'launchConfigFile',
    IS_AUTO_ATTACH_ENABLED: 'isAutoAttachEnabled',
    DEBUG_SESSION_START_TIMEOUT: 'debugSessionStartTimeout',
    AUTO_RESTART_TIMEOUT: 'autoRestartTimeout',
    RETRY_INTERVAL: 'retryInterval'
}

export class ConfigManager {
    private context!: vscode.ExtensionContext;
    private _launchConfigFile: string = DEFAULTS.LAUNCH_CONFIG_FILE
    private _isAutoAttachEnabled: boolean = DEFAULTS.IS_AUTO_ATTACH_ENABLED
    private _debugSessionStartTimeout: number = DEFAULTS.DEBUG_SESSION_START_TIMEOUT
    private _autoRestartTimeout: number = DEFAULTS.AUTO_RESTART_TIMEOUT
    private _retryInterval: number = DEFAULTS.RETRY_INTERVAL

    constructor(context: vscode.ExtensionContext) {
        this.context = context
        this._launchConfigFile = this.context.globalState.get(STATE_KEYS.LAUNCH_CONFIG_FILE, this._launchConfigFile)
        this._isAutoAttachEnabled = this.context.globalState.get(STATE_KEYS.IS_AUTO_ATTACH_ENABLED, this._isAutoAttachEnabled)
        this._debugSessionStartTimeout = this.context.globalState.get(STATE_KEYS.DEBUG_SESSION_START_TIMEOUT, this._debugSessionStartTimeout)
        this._autoRestartTimeout = this.context.globalState.get(STATE_KEYS.AUTO_RESTART_TIMEOUT, this._autoRestartTimeout)
        this._retryInterval = this.context.globalState.get(STATE_KEYS.RETRY_INTERVAL, this._retryInterval)
    }

    public get launchConfigFile(): string {
        return this._launchConfigFile
    }

    public get isAutoAttachEnabled(): boolean {
        return this._isAutoAttachEnabled
    }

    public get debugSessionStartTimeout(): number {
        return this._debugSessionStartTimeout
    }

    public get autoRestartTimeout(): number {
        return this._autoRestartTimeout
    }

    public get retryInterval(): number {
        return this._retryInterval
    }

    public setLaunchConfigFile(file: string) {
        this._launchConfigFile = file
        this.context.globalState.update(STATE_KEYS.LAUNCH_CONFIG_FILE, file);
    }

    public setIsAutoAttachEnabled(enabled: boolean) {
        this._isAutoAttachEnabled = enabled
        this.context.globalState.update(STATE_KEYS.IS_AUTO_ATTACH_ENABLED, enabled);
    }

    public setDebugSessionStartTimeout(ms: number) {
        this._debugSessionStartTimeout = ms
        this.context.globalState.update(STATE_KEYS.DEBUG_SESSION_START_TIMEOUT, ms);
    }

    public setAutoRestartTimeout(ms: number) {
        this._autoRestartTimeout = ms
        this.context.globalState.update(STATE_KEYS.AUTO_RESTART_TIMEOUT, ms);
    }

    public setRetryInterval(ms: number) {
        this._retryInterval = ms
        this.context.globalState.update(STATE_KEYS.RETRY_INTERVAL, ms);
    }
}

