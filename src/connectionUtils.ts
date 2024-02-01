import * as net from 'net';

export function isHostReachable(host: string, port: number): Promise<boolean> {
    const socket = new net.Socket();
    const timeout = 500; // 500 ms timeout
    return new Promise((resolve) => {
        socket.setTimeout(timeout);
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        }).once('timeout', () => {
            socket.destroy();
            resolve(false);
        }).once('error', () => {
            socket.destroy();
            resolve(false);
        }).connect(port, host);
    });
}