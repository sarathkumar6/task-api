function smallestBufferExceeding(buffers, threshold) {
    let minBuffer = Infinity;
    let currentSum = 0;
    let start = 0;

    for ( let end = 0; end < buffers.length; end++) {
        // 1. Expand the window by adding buffers[end]
        currentSum = currentSum + buffers[end];

        while ( currentSum >= threshold ) {
            // 2. Update minBuffer if needed
            minBuffer = Math.min(minBuffer, end - start + 1); // mininum length required to exceed threshold
            // 3. Shrink the window from the start
            currentSum = currentSum - buffers[start];
            start = start + 1;
        }
    }

    return minBuffer === Infinity ? 0 : minBuffer;
}

const burstData = [2, 3, 1, 2, 4, 3];
console.log('Smallest buffer size:', smallestBufferExceeding(burstData, 7));