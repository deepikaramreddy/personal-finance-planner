// ===== User & Data Setup =====

const loggedInUser = localStorage.getItem('loggedInUser');
if (!loggedInUser) {
  window.location.href = 'login.html'; // redirect if not logged in
}

const form = document.getElementById("transaction-form");
const list = document.getElementById("transaction-list");
const incomeEl = document.getElementById("total-income");
const expenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("balance");
const alertMsg = document.getElementById("alert-msg");
const typeSelect = document.getElementById("type");
const categoryInput = document.getElementById("category");
const budgetLimitInput = document.getElementById("budget-limit");
const logoutBtn = document.getElementById("logoutBtn");

function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || [];
}

function getUserData() {
  const users = getUsers();
  return users.find(u => u.email === loggedInUser);
}

function saveUserData(updatedUser) {
  let users = getUsers();
  users = users.map(u => (u.email === updatedUser.email ? updatedUser : u));
  localStorage.setItem('users', JSON.stringify(users));
}

let userData = getUserData();

let transactions = userData.transactions || [];
let budgetLimit = userData.budgetLimit || 0;

// Sync budget limit input field on load
budgetLimitInput.value = budgetLimit;

// ===== Category Input Toggle =====

function toggleCategoryInput() {
  if (typeSelect.value === "income") {
    categoryInput.value = "Salary";
    categoryInput.disabled = true;
    categoryInput.style.backgroundColor = "#e0e0e0";
  } else {
    categoryInput.value = "";
    categoryInput.disabled = false;
    categoryInput.style.backgroundColor = "white";
  }
}

toggleCategoryInput();

typeSelect.addEventListener("change", toggleCategoryInput);

// ===== Save User Data =====

function save() {
  userData.transactions = transactions;
  userData.budgetLimit = budgetLimit;
  saveUserData(userData);
}

// ===== Render Functions =====

function render() {
  list.innerHTML = "";
  let income = 0, expense = 0;
  const labels = [], data = [];
  const categoryTotals = {};

  transactions.forEach(tx => {
    if (tx.type === "income") income += +tx.amount;
    else expense += +tx.amount;

    // Sum categories only for expenses (you can change if needed)
    if (tx.type === "expense") {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + +tx.amount;
    }

    const div = document.createElement("div");
    div.className = `transaction-item ${tx.type}`;
    div.innerHTML = `<strong>${tx.category}</strong><span>₹${parseFloat(tx.amount).toFixed(2)}</span>`;
    list.appendChild(div);
  });

  incomeEl.textContent = income.toFixed(2);
  expenseEl.textContent = expense.toFixed(2);
  balanceEl.textContent = (income - expense).toFixed(2);

  // Budget alert
  if (budgetLimit && expense > budgetLimit) {
    alertMsg.textContent = "🚨 Budget exceeded!";
    alertMsg.style.color = "red";
  } else {
    alertMsg.textContent = "";
  }

  // Prepare chart data for expense categories
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    labels.push(cat);
    data.push(amt.toFixed(2));
  });

  renderCharts(labels, data);
}

let pieChart, barChart;
function renderCharts(labels, data) {
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  const barCtx = document.getElementById("barChart").getContext("2d");

  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: labels.length ? labels : ['No expenses'],
      datasets: [{
        data: data.length ? data : [1],
        backgroundColor: ['#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#f39c12'],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No expenses'],
      datasets: [{
        label: 'Expenses by Category',
        data: data.length ? data : [0],
        backgroundColor: '#e74c3c',
        borderRadius: 5,
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ===== Form Submit =====

form.addEventListener("submit", e => {
  e.preventDefault();

  const tx = {
    type: typeSelect.value,
    category: categoryInput.value.trim(),
    amount: parseFloat(form.amount.value),
    date: form.date.value,
    recurring: form.recurring.checked
  };

  if (!tx.amount || tx.amount <= 0) {
    alert("Please enter a valid amount greater than zero.");
    return;
  }
  if (tx.type === "expense" && tx.category === "") {
    alert("Please enter a category for the expense.");
    return;
  }

  transactions.push(tx);
  save();
  render();
  form.reset();
  toggleCategoryInput(); // Reset category field for income after reset
});

// ===== Budget Limit =====

function setBudgetLimit() {
  const val = parseFloat(budgetLimitInput.value);
  if (isNaN(val) || val < 0) {
    alert("Please enter a valid budget limit (≥ 0).");
    return;
  }
  budgetLimit = val;
  userData.budgetLimit = budgetLimit;
  saveUserData(userData);
  render();
  alertMsg.textContent = `Budget limit set to ₹${budgetLimit.toFixed(2)}`;
  alertMsg.style.color = "#2980b9";
}

// ===== CSV Export =====

function downloadCSV() {
  let csv = "Type,Category,Amount,Date,Recurring\n";
  transactions.forEach(tx => {
    csv += `${tx.type},${tx.category},${tx.amount},${tx.date},${tx.recurring ? "Yes" : "No"}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "transactions.csv";
  link.click();
}

// ===== Logout =====

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
});

// ===== Initialize =====

document.getElementById("budget-limit").addEventListener('change', setBudgetLimit);
document.getElementById("budget-limit").addEventListener('input', () => alertMsg.textContent = '');

render();
