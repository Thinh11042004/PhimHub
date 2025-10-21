#!/usr/bin/env node
import net from 'net';

const [hostPort, timeoutArg] = process.argv.slice(2);
if (!hostPort) {
  console.error('Usage: wait-for <host:port> [--timeout <seconds>]');
  process.exit(1);
}

let timeout = 60;
if (timeoutArg === '--timeout') {
  timeout = parseInt(process.argv[4] || '60', 10);
}

const [host, portStr] = hostPort.split(':');
const port = parseInt(portStr, 10);

const start = Date.now();

function check() {
  const socket = new net.Socket();
  socket.setTimeout(3000);

  socket.on('connect', () => {
    socket.destroy();
    console.log(`${host}:${port} is available`);
    process.exit(0);
  });

  socket.on('timeout', () => {
    socket.destroy();
    retry();
  });

  socket.on('error', () => {
    socket.destroy();
    retry();
  });

  socket.connect(port, host);
}

function retry() {
  if ((Date.now() - start) / 1000 > timeout) {
    console.error(`Timeout after ${timeout}s waiting for ${host}:${port}`);
    process.exit(1);
  }
  setTimeout(check, 1000);
}

check();
