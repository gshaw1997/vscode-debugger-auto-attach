# Debugger Auto Attach for Visual Studio Code

Automatically attaches a debugger to your development process, streamlining your workflow by eliminating the need to manually start your debug sessions. Ideal for developers working on dynamic applications that require frequent debugging or hot reloading.

## Features

- **Automatic Debugger Attachment**: Automatically attaches a debugger to your specified port, making the development process smoother and more efficient.
- **Customizable Timeout**: Set custom timeouts for debug session starts, giving you control over how long the extension waits for a session to begin before timing out.
- **Retry Mechanism**: Automatically retries attaching the debugger if the first attempt fails, ensuring robustness in unstable network conditions or with flaky debug servers.
- **Launch Configuration Selection**: Easily select and switch between different launch configurations directly from the VS Code status bar.
- **Auto-Restart Capability**: Automatically restarts debugging sessions based on user-defined intervals, perfect for watching and debugging long-running applications.

## Installation

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the square icon on the sidebar or pressing `Ctrl+Shift+X`.
3. Search for "Debugger Auto Attach".
4. Click on the Install button.

Alternatively, you can install the extension via the Command Palette:

1. Open the Command Palette with `Ctrl+Shift+P`.
2. Type `ext install debugger-auto-attach` and press Enter.

## Usage

After installation, "Debugger Auto Attach" will automatically attempt to attach to the debugger specified in your project's launch configuration. To customize the extension settings:

1. Open the Command Palette with `Ctrl+Shift+P`.
2. Type `Preferences: Open Settings (JSON)` and press Enter.
3. Add or edit the following settings as needed:

```json
{
  "debuggerAutoAttach.launchConfigFile": "path/to/your/launch.json", // By default this extension will use .vscode/launch.json
  "debuggerAutoAttach.isAutoAttachEnabled": true,
  "debuggerAutoAttach.debugSessionStartTimeout": 30000, // 30 seconds
  "debuggerAutoAttach.autoRestartTimeout": 5000, // 5 seconds
  "debuggerAutoAttach.retryInterval": 500 // 1/2 second
}
```


## Commands

This extension contributes the following commands, accessible from the Command Palette (`Ctrl+Shift+P`):

- `Debugger Auto Attach: Timeout`: Set the timeout for debugger attachment.
- `Debugger Auto Attach: Retry Interval`: Set the interval between retry attempts for debugger attachment.
- `Debugger Auto Attach: Select Launch Configuration`: Select the launch configuration file to use for debugging.
- `Debugger Auto Attach: Toggle Auto-Attach`: Enable or disable automatic debugger attachment.
- `Debugger Auto Attach: Restart Auto-Attach`: Restart the auto-attach process.

## Contributing

Contributions are always welcome! Whether it's submitting bugs, requesting features, or contributing code, please feel free to make your contribution public through GitHub issues and pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.