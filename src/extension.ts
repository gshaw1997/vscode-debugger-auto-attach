import * as vscode from 'vscode';
import { DebuggerAutoAttach } from './debuggerAutoAttach';

export function activate(context: vscode.ExtensionContext) {
    DebuggerAutoAttach.activate(context);
}

export function deactivate() { }


