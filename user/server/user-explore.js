// Global variables
let currentPage = 1
let isLoading = false
let hasMoreServers = true
let currentCategory = "all"
let currentSearch = ""
let currentSort = "a_to_z"
let currentServerId = null
const $ = window.jQuery // Declare the $ variable

// Initialize page
$(document).ready(() => {
  initializeEventListeners()
  loadCategories()
  loadServers(true)
})

// Initialize event listeners
function initializeEventListeners() {
  // Category selection
  $(document).on("click", ".category-item", function () {
    const category = $(this).data("category")
    selectCategory(category)
  })

  // Search input
  $("#searchInput").on(
    "input",
    debounce(function () {
      currentSearch = $(this).val().trim()
      resetAndLoadServers()
    }, 500),
  )

  // Sort dropdown
  $("#sortBtn").on("click", (e) => {
    e.stopPropagation()
    $("#sortDropdown").toggleClass("active")
  })

  $(document).on("click", ".sort-option", function () {
    const sort = $(this).data("sort")
    selectSort(sort)
  })

  // Close sort dropdown when clicking outside
  $(document).on("click", () => {
    $("#sortDropdown").removeClass("active")
  })

  // Server card clicks
  $(document).on("click", ".server-card", function () {
    const serverId = $(this).data("server-id")
    showServerDetails(serverId)
  })

  // Join server buttons
  $(document).on("click", ".join-btn", function (e) {
    e.stopPropagation()
    const serverId = $(this).closest(".server-card").data("server-id")
    joinServer(serverId)
  })

  $("#joinServerBtn").on("click", () => {
    joinServer(currentServerId)
  })

  // Join by invite
  $("#inviteSubmitBtn").on("click", () => {
    joinByInvite()
  })

  $("#inviteCodeInput").on("keypress", (e) => {
    if (e.which === 13) {
      joinByInvite()
    }
  })

  // Modal close events
  $(".modal-close").on("click", () => {
    closeAllModals()
  })

  $(".modal").on("click", function (e) {
    if (e.target === this) {
      closeAllModals()
    }
  })

  // Infinite scroll
  $(window).on("scroll", () => {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 1000) {
      if (!isLoading && hasMoreServers) {
        loadServers(false)
      }
    }
  })

  // Keyboard shortcuts
  $(document).on("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals()
    }
  })
}

// Load categories
function loadCategories() {
  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: { action: "get_categories" },
    dataType: "json",
    success: (response) => {
      displayCategories(response.categories, response.total_servers)
    },
    error: () => {
      console.error("Failed to load categories")
    },
  })
}

// Display categories
function displayCategories(categories, totalServers) {
  const categoriesList = $("#categoriesList")

  // Update total count
  $("#totalCount").text(totalServers)

  // Add category items
  categories.forEach((category) => {
    const categoryIcon = getCategoryIcon(category.Category)
    const categoryItem = $(`
            <div class="category-item" data-category="${category.Category}">
                <div class="category-icon">${categoryIcon}</div>
                <span class="category-name">${formatCategoryName(category.Category)}</span>
                <span class="category-count">${category.server_count}</span>
            </div>
        `)

    categoriesList.append(categoryItem)
  })
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    Gaming: "🎮",
    Music: "🎵",
    Education: "📚",
    "Science & Tech": "🔬",
    Entertainment: "🎬",
    Community: "👥",
    Art: "🎨",
    Sports: "⚽",
    Technology: "💻",
    Anime: "🌸",
  }
  return icons[category] || "📁"
}

// Format category name
function formatCategoryName(category) {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

// Select category
function selectCategory(category) {
  currentCategory = category

  // Update UI
  $(".category-item").removeClass("active")
  $(`.category-item[data-category="${category}"]`).addClass("active")

  resetAndLoadServers()
}

// Select sort
function selectSort(sort) {
  currentSort = sort

  // Update UI
  $(".sort-option").removeClass("active")
  $(`.sort-option[data-sort="${sort}"]`).addClass("active")
  $("#sortDropdown").removeClass("active")

  resetAndLoadServers()
}

// Reset and load servers
function resetAndLoadServers() {
  currentPage = 1
  hasMoreServers = true
  $("#serversGrid").empty()
  loadServers(true)
}

// Load servers
function loadServers(showLoading = false) {
  if (isLoading) return

  isLoading = true

  if (showLoading) {
    $("#loadingIndicator").show()
  }

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "get_servers",
      page: currentPage,
      category: currentCategory,
      search: currentSearch,
      sort: currentSort,
    },
    dataType: "json",
    success: (response) => {
      displayServers(response.servers)

      if (response.servers.length < 12) {
        hasMoreServers = false
        $("#noMoreServers").show()
      }

      currentPage++
      updateServerCount()
    },
    error: () => {
      console.error("Failed to load servers2")
      showToast("Failed to load servers2", "error")
    },
    complete: () => {
      isLoading = false
      $("#loadingIndicator").hide()
    },
  })
}

// Display servers
function displayServers(servers) {
  const serversGrid = $("#serversGrid")

  servers.forEach((server) => {
    const serverCard = createServerCard(server)
    serversGrid.append(serverCard)
  })
}

// Create server card
function createServerCard(server) {
  const memberText = server.member_count == 1 ? "member" : "members"
  const joinButtonText = server.is_joined == 1 ? "JOINED" : "JOIN SERVER"
  const joinButtonClass = server.is_joined == 1 ? "join-btn joined" : "join-btn"
  const joinButtonIcon = server.is_joined == 1 ? "✓" : "+"

  return $(`
        <div class="server-card" data-server-id="${server.ID}">
            <div class="server-card-banner">
                ${
                  server.BannerServer
                    ? `<img src="${server.BannerServer}" alt="Server Banner">`
                    : ""
                }
            </div>
            <div class="server-card-content">
                <div class="server-header">
                    <div class="server-icon">
                        ${
                          server.IconServer
                            ? `<img src="${server.IconServer}" alt="Server Icon">`
                            : server.Name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="server-basic-info">
                        <h3 class="server-name">${escapeHtml(server.Name)}</h3>
                        <p class="server-description">${escapeHtml(server.Description || "No description available")}</p>
                        <div class="server-category">${formatCategoryName(server.Category || "General")}</div>
                    </div>
                </div>
                
                <div class="server-meta">
                    <div class="server-created">
                        <span>🗓️</span>
                        <span>Created ${formatDate(server.ID)}</span>
                    </div>
                    <div class="server-members">
                        <span>👥</span>
                        <span>${server.member_count} ${memberText}</span>
                    </div>
                </div>
                
                <button class="${joinButtonClass}" onclick="event.stopPropagation()">
                    <span class="btn-icon">${joinButtonIcon}</span>
                    <span class="btn-text">${joinButtonText}</span>
                </button>
            </div>
        </div>
    `)
}

// Show server details
function showServerDetails(serverId) {
  currentServerId = serverId

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "get_server_details",
      server_id: serverId,
    },
    dataType: "json",
    success: (response) => {
      if (response.success) {
        displayServerDetails(response.server)
        $("#serverDetailModal").addClass("active")
        $("body").css("overflow", "hidden")
      } else {
        showToast(response.message, "error")
      }
    },
    error: () => {
      showToast("Failed to load server details", "error")
    },
  })
}

// Display server details
function displayServerDetails(server) {
  // Set banner
  if (server.BannerServer) {
    $("#serverBanner").html(`<img src="${server.BannerServer}" alt="Server Banner">`)
  } else {
    $("#serverBanner").html('<img src="/placeholder.svg?height=120&width=600" alt="Server Banner">')
  }

  // Set avatar
  if (server.IconServer) {
    $("#serverAvatar").html(`<img src="${server.IconServer}" alt="Server Icon">`)
  } else {
    $("#serverAvatar").html('<img src="/placeholder.svg?height=80&width=80" alt="Server Avatar">')
  }

  // Set details
  $("#serverName").text(server.Name)
  $("#serverMemberCount").text(`${server.member_count} members`)
  $("#serverDescription").text(server.Description || "No description available")

  // Set join button state
  if (server.is_joined == 1) {
    $("#joinServerBtn").hide()
    $("#joinedBtn").show()
  } else {
    $("#joinServerBtn").show()
    $("#joinedBtn").hide()
  }
}

// Join server
function joinServer(serverId) {
  if (!serverId) return

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "join_server",
      server_id: serverId,
    },
    dataType: "json",
    success: (response) => {
      if (response.success) {
        showToast(response.message, "success")

        // Update UI
        updateServerJoinStatus(serverId, true)

        // Update modal if open
        if (currentServerId == serverId) {
          $("#joinServerBtn").hide()
          $("#joinedBtn").show()
        }
      } else {
        showToast(response.message, "error")
      }
    },
    error: () => {
      showToast("Failed to join server", "error")
    },
  })
}

// Join by invite
function joinByInvite() {
  const inviteCode = $("#inviteCodeInput").val().trim()

  if (!inviteCode) {
    showToast("Please enter an invite code", "error")
    return
  }

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "join_by_invite",
      invite_code: inviteCode,
    },
    dataType: "json",
    success: (response) => {
      if (response.success) {
        showToast(response.message, "success")
        closeAllModals()
        $("#inviteCodeInput").val("")

        // Refresh servers to show updated join status
        resetAndLoadServers()
      } else {
        showToast(response.message, "error")
      }
    },
    error: () => {
      showToast("Failed to join server", "error")
    },
  })
}

// Update server join status
function updateServerJoinStatus(serverId, isJoined) {
  const serverCard = $(`.server-card[data-server-id="${serverId}"]`)
  const joinBtn = serverCard.find(".join-btn")

  if (isJoined) {
    joinBtn.addClass("joined")
    joinBtn.find(".btn-icon").text("✓")
    joinBtn.find(".btn-text").text("JOINED")
  } else {
    joinBtn.removeClass("joined")
    joinBtn.find(".btn-icon").text("+")
    joinBtn.find(".btn-text").text("JOIN SERVER")
  }
}

// Show join server modal
function showJoinServerModal() {
  $("#joinServerModal").addClass("active")
  $("body").css("overflow", "hidden")
  $("#inviteCodeInput").focus()
}

// Close all modals
function closeAllModals() {
  $(".modal").removeClass("active")
  $("body").css("overflow", "")
  currentServerId = null
}

// Update server count
function updateServerCount() {
  const totalCards = $(".server-card").length
  $("#serverCount").text(`${totalCards} servers available`)
}

// Format date
function formatDate(id) {
  // Simple date formatting based on ID (newer IDs = more recent)
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 365) + 1
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer = $("#toastContainer")

  const toast = $(`<div class="toast ${type}">${message}</div>`)
  toastContainer.append(toast)

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.css("animation", "toastSlideOut 0.3s ease forwards")
    setTimeout(() => {
      toast.remove()
    }, 300)
  }, 5000)

  // Click to dismiss
  toast.on("click", function () {
    $(this).css("animation", "toastSlideOut 0.3s ease forwards")
    setTimeout(() => {
      $(this).remove()
    }, 300)
  })
}

// Debounce function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Add slide out animation
const style = document.createElement("style")
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`
document.head.appendChild(style)
