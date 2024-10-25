// Global Variables
let currentVisits = localStorage.getItem("clientTotalVisits");
if (currentVisits === null) {
  currentVisits = 0;
}

// Event Listeners
$(window).on("load", function () {
  // Update HTML element
  $("#visits").html(++currentVisits);
  // Update localStorage
  localStorage.setItem("clientTotalVisits", currentVisits);
});

document.getElementById("species").addEventListener("change", getRandomImage);

document.getElementById("zip").addEventListener("change", function () {
  // Get the ZIP code value
  const zipCode = document.getElementById("zip").value;
  console.log(zipCode);

  // Call the function to fetch city information
  getCityFromZipCode(zipCode);
});

document.addEventListener("DOMContentLoaded", async function () {
  try {
    let url = "https://csumb.space/api/allStatesAPI.php";

    let response = await fetch(url);

    // Convert response to JSON
    let data = await response.json();

    let stateList = document.querySelector("#state");

    // Loop to insert the options into the state select in the HTML file
    stateList.innerHTML = "<option> Select State </option>";
    for (let state of data) {
      stateList.innerHTML += `<option>${state.usps}</option>`;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

document.querySelector("form").addEventListener("submit", function (event) {
  // Get the city value from the span element
  var cityValue = document.getElementById("city").innerHTML;
  

  // Append a hidden input field to the form and set its value to the city value
  var hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.name = "cityInput";
  hiddenInput.value = cityValue;
  this.appendChild(hiddenInput);

  // Continue with the form submission
  return true;
});

//FUNCTIONS
function getCityFromZipCode(zipCode) {
  // Make an API request to fetch city information based on ZIP code
  fetch(`https://csumb.space/api/cityInfoAPI.php?zip=${zipCode}`)
    .then((response) => response.json())
    .then((data) => {
      // Update the city span with the fetched city information
      //document.getElementById('city').innerText = data.city;
      document.getElementById("city").value = data.city;
      document.getElementById("state").value = data.state;
    })
    .catch((error) => {
      // Handle errors, e.g., display an error message
      console.error("Error fetching city information:", error);
    });
}

async function getRandomImage() {
  // Generate a random URL for an image
  let species = document.getElementById("species").value;
  let client_id = "wJGA7SjdgjkDb4gQuJfLJtH6gjasetXeV5Ofcs1Tg2o"; 
  if (species === "Other" || species === null) {
    return; 
  } else {
    let url = `https://api.unsplash.com/photos/random/?client_id=${client_id}&featured=true&query=+${species}`;
    let response = await fetch(url);
    let data = await response.json();
    let image = data.urls.small;
    document.getElementById("imgurl").value = image;
  }
}