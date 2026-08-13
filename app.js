/* Comfort Lux - Interactive App Logic (Tenge Currency & Updated Contacts) */

// Product Data Registry for Quick View Modal
const PRODUCT_DATA = {
  sofa_emerald: {
    title: "Диван Sovereign Emerald",
    category: "Гостиная • Флагман",
    specs: "Модульная система со структурой из массива бука, обивка из итальянского изумрудного велюра Loro Piana с латунным цоколем.",
    price: "2 850 000 ₸",
    img: "./assets/sofa_emerald.jpg"
  },
  dining_table: {
    title: "Стол Imperia Marble",
    category: "Столовые зоны",
    specs: "Цельная столешница из итальянского мрамора Calacatta Gold с матовой гидрофобной пропиткой и ногами из сатинированной бронзы.",
    price: "3 700 000 ₸",
    img: "./assets/dining_table.jpg"
  },
  luxury_bed: {
    title: "Кровать Master Suite",
    category: "Спальная резиденция",
    specs: "Каркас из бука и ясеня, объемное изголовье в мягкой коже Nappa с контурной диодной подсветкой warm-gold.",
    price: "3 200 000 ₸",
    img: "./assets/luxury_bed.jpg"
  },
  executive_desk: {
    title: "Стол Executive Noir",
    category: "Кабинет руководителя",
    specs: "Массив мореного американского ореха, встроенные порты питания, беспроводная зарядка QI и кожаная вставка.",
    price: "2 300 000 ₸",
    img: "./assets/executive_desk.jpg"
  },
  walkin_wardrobe: {
    title: "Гардеробная Atelier Glass",
    category: "Гардеробный комплекс",
    specs: "Тонированное закаленное стекло, профили цвета розе-голд, замшевые отделки выдвижных секций и мраморный остров.",
    price: "5 300 000 ₸",
    img: "./assets/walkin_wardrobe.jpg"
  },
  lounge_chair: {
    title: "Кресло Lounge Bouclé",
    category: "Лаунж зона",
    specs: "Скульптурный силуэт, итальянская альпийская ткань букле с повышенной износостойкостью и опорный каркас из ореха.",
    price: "1 250 000 ₸",
    img: "./assets/lounge_chair.jpg"
  }
};

// 1. Sticky Navbar Scroll Listener
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// 2. Mobile Drawer Navigation
function toggleMobileNav() {
  const mobileNav = document.getElementById('mobile-nav');
  mobileNav.classList.toggle('active');
}

// 3. Catalog Filter Tabs
document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('#catalog-filters .tab-btn');
  const productCards = document.querySelectorAll('#catalog-grid .product-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      productCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || filter === cat) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Initial calculation
  updateCalc();
});

// 4. Customizer Logic
let customizerBasePrice = 2850000;
let materialAddPrice = 0;
let finishAddPrice = 0;
let sizeAddPrice = 0;

function updateCustomizerMaterial(element) {
  // Update UI active swatch
  const swatches = element.parentElement.querySelectorAll('.swatch');
  swatches.forEach(s => s.classList.remove('active'));
  element.classList.add('active');

  const matName = element.getAttribute('data-name');
  const imgUrl = element.getAttribute('data-img');
  materialAddPrice = parseInt(element.getAttribute('data-price-add')) || 0;

  document.getElementById('sel-material-name').textContent = matName;
  
  // Smooth image swap
  const imgElem = document.getElementById('customizer-image');
  imgElem.style.opacity = '0.3';
  setTimeout(() => {
    imgElem.src = imgUrl;
    imgElem.style.opacity = '1';
  }, 200);

  calculateCustomizerPrice();
}

function updateCustomizerFinish(element) {
  const swatches = element.parentElement.querySelectorAll('.swatch');
  swatches.forEach(s => s.classList.remove('active'));
  element.classList.add('active');

  const finishName = element.getAttribute('data-finish');
  finishAddPrice = parseInt(element.getAttribute('data-price-finish')) || 0;

  document.getElementById('sel-finish-name').textContent = finishName;
  calculateCustomizerPrice();
}

function updateCustomizerSize(selectElement) {
  sizeAddPrice = parseInt(selectElement.value) || 0;
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const sizeText = selectedOption.getAttribute('data-size-text') || selectedOption.text;
  document.getElementById('sel-size-name').textContent = sizeText;
  calculateCustomizerPrice();
}

function calculateCustomizerPrice() {
  const total = customizerBasePrice + materialAddPrice + finishAddPrice + sizeAddPrice;
  document.getElementById('customizer-final-price').textContent = total.toLocaleString('ru-RU') + ' ₸';
}

// 5. Price Estimator Calculator Logic
let currentTypeRate = 110000;
let currentTierMult = 1.35;

function selectCalcType(cardElement) {
  const siblings = cardElement.parentElement.querySelectorAll('.calc-card');
  siblings.forEach(c => c.classList.remove('selected'));
  cardElement.classList.add('selected');
  currentTypeRate = parseInt(cardElement.getAttribute('data-type-rate')) || 110000;
  updateCalc();
}

function selectCalcTier(cardElement) {
  const siblings = cardElement.parentElement.querySelectorAll('.calc-card');
  siblings.forEach(c => c.classList.remove('selected'));
  cardElement.classList.add('selected');
  currentTierMult = parseFloat(cardElement.getAttribute('data-tier-mult')) || 1.0;
  updateCalc();
}

function updateCalc() {
  const areaRange = document.getElementById('calc-area-range');
  const areaValDisp = document.getElementById('calc-area-val');
  const totalDisp = document.getElementById('calc-total-result');

  if (!areaRange || !totalDisp) return;

  const area = parseInt(areaRange.value);
  areaValDisp.textContent = area;

  const total = Math.round(area * currentTypeRate * currentTierMult);
  totalDisp.textContent = total.toLocaleString('ru-RU') + ' ₸';
}

// 6. FAQ Accordion
function toggleFaq(questionElem) {
  const faqItem = questionElem.parentElement;
  const isActive = faqItem.classList.contains('active');

  // Close all
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });

  // Toggle clicked
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// 7. Modal Windows System
function openModal(modalId, itemPresetName = null) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (itemPresetName) {
      const selectElem = document.getElementById('modal-select-item');
      if (selectElem) {
        let found = false;
        for (let i = 0; i < selectElem.options.length; i++) {
          if (selectElem.options[i].value.includes(itemPresetName) || selectElem.options[i].text.includes(itemPresetName)) {
            selectElem.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          const opt = document.createElement('option');
          opt.value = itemPresetName;
          opt.text = itemPresetName;
          opt.selected = true;
          selectElem.add(opt);
        }
      }
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// Close modal when clicking on backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});

// 8. Quick View Populator
function openQuickView(productKey) {
  const data = PRODUCT_DATA[productKey];
  if (!data) return;

  document.getElementById('qv-img').src = data.img;
  document.getElementById('qv-category').textContent = data.category;
  document.getElementById('qv-title').textContent = data.title;
  document.getElementById('qv-specs').textContent = data.specs;
  document.getElementById('qv-price').textContent = data.price;

  const btnOrder = document.getElementById('qv-btn-order');
  btnOrder.onclick = () => {
    closeModal('modal-quickview');
    openModal('modal-consultation', data.title);
  };

  openModal('modal-quickview');
}

// 9. Toast Notification System & Form Handler
function handleFormSubmit(event, successMessage) {
  event.preventDefault();
  const form = event.target;

  // Show Toast
  showToast(successMessage);

  // Close modal
  const modal = form.closest('.modal-backdrop');
  if (modal) {
    closeModal(modal.id);
  }

  // Reset form
  form.reset();
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #D4AF37; font-size: 1.2rem;"></i> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
