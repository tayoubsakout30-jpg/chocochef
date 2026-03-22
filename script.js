// script.js
const BOT_TOKEN = "8734950139:AAEZjrkK_yNcBCIqu-67d7IxnmnK85pQSlE";
const CHAT_ID = "8539469656";

const productMap = [
  { id: "qty_dough_2kg", name: "عجينة الطلي 2 kg", arName: "عجينة الطلي 2 كلغ" },
  { id: "qty_dough_3kg", name: "عجينة الطلي 3 kg", arName: "عجينة الطلي 3 كلغ" },
  { id: "qty_dough_10kg", name: "عجينة الطلي 10 kg", arName: "عجينة الطلي 10 كلغ" },
  { id: "qty_choc_milk", name: "بيبيت Milk chocolate", arName: "بيبيت حليب" },
  { id: "qty_choc_dark", name: "بيبيت Dark chocolate", arName: "بيبيت داكن" },
  { id: "qty_choc_white", name: "بيبيت White chocolate", arName: "بيبيت أبيض" }
];

const productsSection = document.getElementById("productsSection");
const orderSection = document.getElementById("orderSection");
const continueBtn = document.getElementById("continueOrderBtn");
const backBtn = document.getElementById("backToProductsBtn");
const confirmBtn = document.getElementById("confirmOrderBtn");
const orderSummaryList = document.getElementById("orderSummaryList");

function getSelectedProducts() {
  const selected = [];
  for (const product of productMap) {
    const input = document.getElementById(product.id);
    const qty = input ? parseInt(input.value, 10) : 0;
    if (qty > 0) {
      selected.push({
        ...product,
        quantity: qty
      });
    }
  }
  return selected;
}

function buildOrderSummary(selectedItems) {
  orderSummaryList.innerHTML = "";
  if (selectedItems.length === 0) {
    orderSummaryList.innerHTML = `<div class="summary-item" style="justify-content:center;">No items selected</div>`;
    return;
  }
  selectedItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "summary-item";
    div.innerHTML = `
      <span class="summary-name">${item.name}</span>
      <span class="summary-qty">× ${item.quantity}</span>
    `;
    orderSummaryList.appendChild(div);
  });
}

continueBtn.addEventListener("click", () => {
  const selected = getSelectedProducts();
  if (selected.length === 0) {
    alert("Please select at least one product before continuing.");
    return;
  }
  buildOrderSummary(selected);
  productsSection.style.display = "none";
  orderSection.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

backBtn.addEventListener("click", () => {
  orderSection.style.display = "none";
  productsSection.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function formatTelegramMessage(selected, firstName, lastName, phone) {
  let productLines = "";
  selected.forEach(p => {
    productLines += `• ${p.name} : ${p.quantity} unités\n`;
  });
  const fullName = `${firstName} ${lastName}`.trim();
  const customerInfo = `👤 Client: ${fullName}\n📞 Téléphone: ${phone}`;
  return `🍫 *NOUVELLE COMMANDE CHOCOCHEF* 🍫\n\n${productLines}\n${customerInfo}\n\n✨ Merci de traiter rapidement ✨`;
}

function sendToTelegram(message) {
  if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN" || !CHAT_ID || CHAT_ID === "YOUR_CHAT_ID") {
    alert("⚠️ Telegram bot non configuré. Veuillez renseigner BOT_TOKEN et CHAT_ID dans script.js");
    return Promise.reject("Missing token");
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "Markdown"
  };
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

confirmBtn.addEventListener("click", async () => {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phoneNumber").value.trim();
  if (!firstName || !lastName || !phone) {
    alert("Veuillez remplir tous les champs (prénom, nom, téléphone).");
    return;
  }
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[\)]?[-\s\.0-9]{5,15}$/;
  if (!phoneRegex.test(phone)) {
    alert("Numéro de téléphone invalide. Utilisez un format correct (+213 ...)");
    return;
  }
  const selectedItems = getSelectedProducts();
  if (selectedItems.length === 0) {
    alert("Aucun produit sélectionné. Retour à la sélection.");
    orderSection.style.display = "none";
    productsSection.style.display = "block";
    return;
  }
  const telegramMessage = formatTelegramMessage(selectedItems, firstName, lastName, phone);
  try {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Envoi en cours...';
    const response = await sendToTelegram(telegramMessage);
    if (response.ok) {
      alert("✅ Commande confirmée ! Merci, un conseiller vous contactera sous peu.");
      for (const product of productMap) {
        const input = document.getElementById(product.id);
        if (input) input.value = "0";
      }
      document.getElementById("firstName").value = "";
      document.getElementById("lastName").value = "";
      document.getElementById("phoneNumber").value = "";
      orderSection.style.display = "none";
      productsSection.style.display = "block";
    } else {
      const errorData = await response.json();
      console.error(errorData);
      alert("Erreur lors de l'envoi. Veuillez réessayer ou contacter le support.");
    }
  } catch (error) {
    console.error(error);
    alert("Problème de connexion. Vérifiez votre réseau ou réessayez.");
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm order';
  }
});