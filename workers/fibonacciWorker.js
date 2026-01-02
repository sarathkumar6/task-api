const { parentPort, workerData } = require('worker_threads');

function calculateFibonacci(n) {
    if (n <= 1) return n;
    return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

const result = calculateFibonacci(workerData.number);

parentPort.postMessage(result);
