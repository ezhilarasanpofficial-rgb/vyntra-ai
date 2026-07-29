let conversationHistory = [];
// ==========================================
// EZHIL AI - FRONTEND JAVASCRIPT
// Flask + Ollama + Llama 3.2:3B
// ==========================================

const API_URL = "https://vyntra-ai-api.ezhilarasanpofficial.workers.dev";   
const GOOGLE_CLIENT_ID =

    "271448546787-sabrgtig9evo5mbkhhnpnpet5g1mrvj8.apps.googleusercontent.com";
let currentUser = null;

window.onload = function () {

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin
    });

    google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        {
            theme: "outline",
            size: "large",
            shape: "pill",
            text: "continue_with",
            width: 280
        }
    );
};


async function handleGoogleLogin(response) {
    const payload = parseJwt(response.credential);

    currentUser = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture
    };

    console.log("Google user:", currentUser);

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "check_access",
                email: currentUser.email,
                name: currentUser.name
            })
        });

        const data = await res.json();

        console.log("Access check:", data);

        if (data.status === "approved") {
            document.getElementById("loginScreen").style.display = "none";
            document.getElementById("mainApp").style.display = "flex";
            return;
        }

        if (data.status === "denied") {
            alert("Access denied. Your account is not authorized to use VYNTRA AI.");
            currentUser = null;
            return;
        }

        alert("Access not approved yet. Please wait for administrator approval.");
        currentUser = null;

    } catch (error) {
        console.error("Access check failed:", error);
        alert("Unable to verify access. Please try again.");
        currentUser = null;
    }
}


function parseJwt(token) {

    const base64Url = token.split(".")[1];

    const base64 = base64Url
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split("")
            .map(function (c) {
                return "%" +
                    ("00" + c.charCodeAt(0).toString(16))
                        .slice(-2);
            })
            .join("")
    );

    return JSON.parse(jsonPayload);
}

// ==========================================
// ELEMENTS
// ==========================================

const heroInput = document.getElementById("heroInput");
const heroSend = document.getElementById("heroSend");

const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const welcome = document.getElementById("welcome");
const messages = document.getElementById("messages");

const bottomInputArea = document.getElementById("bottomInputArea");

const newChat = document.getElementById("newChat");
const clearChat = document.getElementById("clearChat");

const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");
const closeMenu = document.getElementById("closeMenu");
const mobileOverlay = document.getElementById("mobileOverlay");


// ==========================================
// CHAT STATE
// ==========================================

let chatStarted = false;
let isGenerating = false;


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage(message) {

    const text = message.trim();

    if (!text || isGenerating) {
        return;
    }

    isGenerating = true;

    startChat();

    addMessage(text, "user");

    clearInputs();

    const typingElement = showTyping();

    setSendButtonsDisabled(true);

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
    message: text,
    email: currentUser?.email,
    history: conversationHistory
})

        });


        const data = await response.json();


        typingElement.remove();


        if (!response.ok) {

            const errorMessage =
                data.error ||
                "Something went wrong.";

            addMessage(
                errorMessage,
                "bot",
                true
            );

            return;
        }


const reply =
    data.reply ||
    "I couldn't generate a response.";

conversationHistory.push({
    role: "user",
    text: text
});

conversationHistory.push({
    role: "assistant",
    text: reply
});

// Keep only recent conversation to avoid huge API requests
if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
}

addMessage(
    reply,
    "bot"
);


} catch (error) {

    console.error(
        "VYNTRA AI Error:",
        error
    );

    typingElement.remove();

    addMessage(
        "DEBUG ERROR: " + (error?.message || String(error)),
        "bot",
        true
    );

    } finally {

        isGenerating = false;

        setSendButtonsDisabled(false);

        userInput?.focus();

    }
}


// ==========================================
// START CHAT UI
// ==========================================

function startChat() {

    if (chatStarted) {
        return;
    }

    chatStarted = true;


    if (welcome) {

        welcome.style.display = "none";

    }


    if (messages) {

        messages.style.display = "flex";

    }


    if (bottomInputArea) {

        bottomInputArea.classList.add(
            "active"
        );

    }
}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(
    text,
    type,
    isError = false
) {

    if (!messages) {
        return;
    }


    const row =
        document.createElement("div");


    row.className =
        `message-row ${type}`;


    const avatar =
        document.createElement("div");


    avatar.className =
        `message-avatar ${type}`;


    avatar.textContent =
        type === "user"
            ? "EP"
            : "AI";


    const bubble =
        document.createElement("div");


    bubble.className =
        `message-bubble ${type}`;


    if (isError) {

        bubble.classList.add(
            "error-message"
        );

    }


    // textContent prevents HTML injection
if (type === "bot" && !isError) {
    bubble.innerHTML = marked.parse(text);
} else {
    bubble.textContent = text;
}


    if (type === "user") {

        row.appendChild(bubble);
        row.appendChild(avatar);

    } else {

        row.appendChild(avatar);
        row.appendChild(bubble);

    }


    messages.appendChild(row);


    scrollToBottom();
}


// ==========================================
// TYPING INDICATOR
// ==========================================

function showTyping() {

    const row =
        document.createElement("div");


    row.className =
        "message-row bot typing-row";


    const avatar =
        document.createElement("div");


    avatar.className =
        "message-avatar bot";


    avatar.textContent = "AI";


    const typing =
        document.createElement("div");


    typing.className =
        "message-bubble bot typing";


    typing.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;


    row.appendChild(avatar);
    row.appendChild(typing);


    messages.appendChild(row);


    scrollToBottom();


    return row;
}


// ==========================================
// HERO INPUT
// ==========================================

if (heroSend) {

    heroSend.addEventListener(
        "click",
        () => {

            if (!heroInput) {
                return;
            }

            sendMessage(
                heroInput.value
            );

        }
    );

}


if (heroInput) {

    heroInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage(
                    heroInput.value
                );

            }

        }
    );


    heroInput.addEventListener(
        "input",
        () => {

            autoResize(
                heroInput
            );

        }
    );

}


// ==========================================
// BOTTOM CHAT INPUT
// ==========================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        () => {

            if (!userInput) {
                return;
            }

            sendMessage(
                userInput.value
            );

        }
    );

}


if (userInput) {

    userInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage(
                    userInput.value
                );

            }

        }
    );


    userInput.addEventListener(
        "input",
        () => {

            autoResize(
                userInput
            );

        }
    );

}


// ==========================================
// QUICK SUGGESTION CARDS
// ==========================================

function useSuggestion(text) {

    if (heroInput) {

        heroInput.value = text;

    }

    sendMessage(text);
}


// Make available to HTML onclick
window.useSuggestion =
    useSuggestion;


// ==========================================
// NEW CHAT
// ==========================================

if (newChat) {

    newChat.addEventListener(
        "click",
        resetChat
    );

}


// ==========================================
// CLEAR CHAT
// ==========================================

if (clearChat) {

    clearChat.addEventListener(
        "click",
        resetChat
    );

}


// ==========================================
// RESET CHAT
// ==========================================

function resetChat() {
conversationHistory = [];
    chatStarted = false;
    isGenerating = false;


    if (messages) {

        messages.innerHTML = "";

        messages.style.display =
            "none";

    }


    if (welcome) {

        welcome.style.display =
            "";

    }


    if (bottomInputArea) {

        bottomInputArea.classList.remove(
            "active"
        );

    }


    clearInputs();

    setSendButtonsDisabled(false);

    closeSidebar();


    setTimeout(
        () => {

            heroInput?.focus();

        },
        100
    );
}


// ==========================================
// CLEAR INPUTS
// ==========================================

function clearInputs() {

    if (heroInput) {

        heroInput.value = "";

        heroInput.style.height =
            "auto";

    }


    if (userInput) {

        userInput.value = "";

        userInput.style.height =
            "auto";

    }
}


// ==========================================
// TEXTAREA AUTO RESIZE
// ==========================================

function autoResize(element) {

    if (!element) {
        return;
    }


    element.style.height =
        "auto";


    element.style.height =
        Math.min(
            element.scrollHeight,
            150
        ) + "px";
}


// ==========================================
// SCROLL TO BOTTOM
// ==========================================

function scrollToBottom() {

    if (!messages) {
        return;
    }


    setTimeout(
        () => {

            messages.scrollTop =
                messages.scrollHeight;

        },
        50
    );
}


// ==========================================
// BUTTON DISABLE
// ==========================================

function setSendButtonsDisabled(
    disabled
) {

    if (heroSend) {

        heroSend.disabled =
            disabled;

    }


    if (sendBtn) {

        sendBtn.disabled =
            disabled;

    }
}


// ==========================================
// MOBILE SIDEBAR
// ==========================================

function openSidebar() {

    if (sidebar) {

        sidebar.classList.add(
            "open"
        );

    }


    if (mobileOverlay) {

        mobileOverlay.classList.add(
            "active"
        );

    }
}


function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (mobileOverlay) {

        mobileOverlay.classList.remove(
            "active"
        );

    }
}


if (menuButton) {

    menuButton.addEventListener(
        "click",
        openSidebar
    );

}


if (closeMenu) {

    closeMenu.addEventListener(
        "click",
        closeSidebar
    );

}


if (mobileOverlay) {

    mobileOverlay.addEventListener(
        "click",
        closeSidebar
    );

}


// ESC closes sidebar
document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeSidebar();

        }

    }
);


// ==========================================
// INITIAL SETUP
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (messages) {

            messages.style.display =
                "none";

        }


        if (bottomInputArea) {

            bottomInputArea.classList.remove(
                "active"
            );

        }


        setTimeout(
            () => {

                heroInput?.focus();

            },
            300
        );

    }
);