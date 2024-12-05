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

function toggleLike(profileId) {
  fetch(`/like/${profileId}`, { method: 'POST' })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.getElementById(`like-count-${profileId}`).innerText = data.likes;
      }
    })
    .catch(error => console.error('Error liking profile:', error));
}

// Function to delete posts
async function deletePost(postId) {
  // Show confirmation pop-up
  const isConfirmed = confirm("Are you sure you want to delete this post?");

  if (isConfirmed) {
    const response = await fetch(`/blog/${postId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      // Remove the post element from the DOM by matching data-post_id
      const postElement = document.querySelector(`.post[data-id="${postId}"]`);
      if (postElement) {
        postElement.remove();
      }
    } else {
      alert("Failed to delete the post. Please try again.");
    }
  } else {
    console.log("Deletion cancelled");
  }
}

async function editPost(postId, newTitle, newContent) {
  try {
    // Log the inputs to make sure they are not undefined or empty
    console.log("Post ID:", postId, "Title:", newTitle, "Content:", newContent);

    // Validate the inputs before making the request
    if (!newTitle || !newContent) {
      alert("Both title and content are required.");
      return; // Stop the function if the inputs are invalid
    }

    // Prepare the data to send in the body of the PUT request
    const postData = { title: newTitle, content: newContent };
    console.log("Sending data:", postData); // Log the data to be sent

    const response = await fetch(`/blog/edit/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    // Check the response status and handle it
    const result = await response.json();
    if (response.ok && result.success) {
      window.location.reload(); // Reload the page or dynamically update the post
    } else {
      alert(result.message || 'Failed to update the post.');
    }
  } catch (error) {
    console.error('Error updating post:', error);
  }
}


// Show edit form
function showEditForm(postId) {
  document.getElementById(`edit-form-${postId}`).style.display = "block";
}

// Hide edit form
function hideEditForm(postId) {
  document.getElementById(`edit-form-${postId}`).style.display = "none";
}

// Submit edit form
async function submitEdit(postId) {
  const newTitle = document.getElementById(`edit-title`).value;
  const newContent = document.getElementById(`edit-content`).value;
  await editPost(postId, newTitle, newContent);
}

// Flag a post
async function toggleFlag(postId, flagStatus) {
  try {
    const response = await fetch(`/blog/${postId}/${flagStatus ? 'flag' : 'unflag'}`, {
      method: 'POST',
    });
    if (response.ok) {
      location.reload(); // Reload the page to reflect changes
    } else {
      alert("Failed to update flag status.");
    }
  } catch (error) {
    console.error("Error toggling flag status:", error);
  }
}

// Explore Page
const map = new mapboxgl.Map({
  container: "map", // Ensure this matches your HTML element ID
  style: "mapbox://styles/mapbox/streets-v11",
  center: [-118.2437, 34.0522], // Default coordinates (e.g., Los Angeles)
  zoom: 10, // Default zoom level
});


filteredLocations.forEach((location) => {
  if (location.longitude && location.latitude) {
    const marker = new mapboxgl.Marker() // Ensure marker attaches to the map
      .setLngLat([location.longitude, location.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }) // Optional: Customize popup offset
          .setHTML(
            `<strong>${location.type}</strong><br>${location.city}, ${location.state}`
          )
      )
      .addTo(map); // Attach to the Mapbox map instance
    markers.push(marker);
  }
});

// Profiles FLoating Box
function openModal(profileBox) {
  const profileData = profileBox.getAttribute('data-profile');
  const profile = JSON.parse(profileData);

  // Populate modal content
    document.getElementById('modalProfileImage').src =
      profile.image_url || '/img/default-profile.png';

    const modalContent = document.getElementById('modalProfileContent');
    modalContent.innerHTML = `
      <h2>My name is: ${profile.name}</h2>
      <p><strong>Species:</strong> ${profile.species}</p>
      <p><strong>Age:</strong> ${profile.age}</p>
      <p><strong>Gender:</strong> ${profile.gender}</p>
      <p><strong>City:</strong> ${profile.city}, ${profile.state}</p>
      <br/>
      <p><strong>Bio:</strong> ${profile.bio}</p>
      <br/>
      <div class="fake-button">Friend Request</div>
    `;

  const modal = document.getElementById('profileModal');
  modal.classList.add('show');
}

function closeModal() {
  const modal = document.getElementById('profileModal');
  modal.classList.remove('show');
}

// Filter Menu
function toggleDropdown() {
  const dropdownContent = document.getElementById("dropdownContent");
  dropdownContent.style.display = dropdownContent.style.display === "none" ? "block" : "none";
}

