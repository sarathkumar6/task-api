function findMaxTaffic(numberOfRequestsArray, windowSize) {
  let maxSum = 0;
  let windowSum = 0;

  // 1. Calculate sum of first window
  for (let i = 0; i < windowSize; i++) {
    windowSum = windowSum + numberOfRequestsArray[i];
  }
  maxSum = windowSum;

  // 2. Slide the window
  // Why use windowSize here?
  // because we are removing the element going out of the window
  // and adding the element coming into the window
  for (let i = windowSize; i < numberOfRequestsArray.length; i++) {
    // Why i - windowSize?
    // because that is the index of the element going out of the window
    windowSum =
      windowSum -
      numberOfRequestsArray[i - windowSize] +
      numberOfRequestsArray[i];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum / windowSize; // Return average
}

const rpsLogs = [2, 3, 1, 5, 1, 3, 2, 7, 4, 5];
console.log("Average Taffic Load is: ", findMaxTaffic(rpsLogs, 3)); // Expected output: 9 (5+1+3)
