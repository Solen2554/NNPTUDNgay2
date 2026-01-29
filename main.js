// Lưu ý: Để fetch db.json bằng fetch, bạn cần chạy server local (không mở file trực tiếp bằng file://)
let products = [];
let categories = [];
let filteredProducts = [];
let sortType = '';
let searchText = '';

function getCategoryListFromProducts(products) {
  const map = {};
  products.forEach(p => {
    if (p.category && p.category.id && p.category.name) {
      map[p.category.id] = { ...p.category };
    }
  });
  return Object.values(map);
}

// Fetch dữ liệu và khởi tạo
fetch('db.json')
  .then(res => res.json())
  .then(data => {
    products = data;
    categories = getCategoryListFromProducts(products);
    renderCategoryOptions();
    renderCategoryList();
    renderTable();
  })
  .catch(err => {
    document.getElementById('product-list').textContent = 'Lỗi khi tải dữ liệu sản phẩm.';
    console.error(err);
  });

// Tìm kiếm
function onSearchChanged() {
  searchText = document.getElementById('searchInput').value.trim().toLowerCase();
  renderTable();
}

// Sắp xếp
function sortBy(type) {
  sortType = type;
  renderTable();
}

// Render bảng sản phẩm
function renderTable() {
  let arr = products.slice();
  // Lọc theo tên
  if (searchText) {
    arr = arr.filter(p => p.title.toLowerCase().includes(searchText));
  }
  // Sắp xếp
  if (sortType === 'name') {
    arr.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortType === 'priceAsc') {
    arr.sort((a, b) => a.price - b.price);
  } else if (sortType === 'priceDesc') {
    arr.sort((a, b) => b.price - a.price);
  } else if (sortType === 'category') {
    arr.sort((a, b) => (a.category?.name || '').localeCompare(b.category?.name || ''));
  }
  filteredProducts = arr;
  const tbody = document.getElementById('productTableBody');
  tbody.innerHTML = '';
  arr.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.images && p.images[0] ? p.images[0] : ''}" alt="" style="width:60px;height:40px;object-fit:cover;border-radius:4px;"></td>
      <td>${p.title}</td>
      <td>${p.price.toLocaleString()} đ</td>
      <td>${p.category?.name || ''}</td>
      <td>${p.description || ''}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="openProductModal(${p.id})">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Xóa</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render option category cho select
function renderCategoryOptions(selectedId) {
  const select = document.getElementById('productCategory');
  if (!select) return;
  select.innerHTML = categories.map(c =>
    `<option value="${c.id}" ${selectedId == c.id ? 'selected' : ''}>${c.name}</option>`
  ).join('');
}

// Modal Thêm/Sửa sản phẩm
let productModal;
function openProductModal(id) {
  if (!productModal) productModal = new bootstrap.Modal(document.getElementById('productModal'));
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModalTitle').textContent = id ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
  renderCategoryOptions();
  if (id) {
    const p = products.find(x => x.id == id);
    if (p) {
      document.getElementById('productId').value = p.id;
      document.getElementById('productTitle').value = p.title;
      document.getElementById('productPrice').value = p.price;
      document.getElementById('productCategory').value = p.category?.id || '';
      document.getElementById('productImage').value = p.images && p.images[0] ? p.images[0] : '';
      document.getElementById('productDesc').value = p.description || '';
    }
  }
  productModal.show();
}

// Lưu sản phẩm (thêm/sửa)
function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const title = document.getElementById('productTitle').value.trim();
  const price = Number(document.getElementById('productPrice').value);
  const catId = document.getElementById('productCategory').value;
  const catObj = categories.find(c => c.id == catId);
  const image = document.getElementById('productImage').value.trim();
  const desc = document.getElementById('productDesc').value.trim();
  if (!title || !catObj) return;
  if (id) {
    // Sửa
    const idx = products.findIndex(x => x.id == id);
    if (idx > -1) {
      products[idx] = {
        ...products[idx],
        title, price, description: desc,
        category: { ...catObj },
        images: image ? [image] : []
      };
    }
  } else {
    // Thêm
    const newId = Date.now();
    products.push({
      id: newId,
      title, price, description: desc,
      category: { ...catObj },
      images: image ? [image] : [],
      creationAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  productModal.hide();
  renderTable();
}

// Xóa sản phẩm
function deleteProduct(id) {
  if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
    products = products.filter(p => p.id != id);
    renderTable();
  }
}

// Modal quản lý category
let categoryModal;
function openCategoryModal() {
  if (!categoryModal) categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
  document.getElementById('categoryForm').reset();
  renderCategoryList();
  categoryModal.show();
}

// Lưu category mới
function saveCategory(e) {
  e.preventDefault();
  const name = document.getElementById('newCategoryName').value.trim();
  if (!name) return;
  // Kiểm tra trùng tên
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('Category đã tồn tại!');
    return;
  }
  const newId = Date.now();
  categories.push({
    id: newId,
    name: name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    image: '',
    creationAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  renderCategoryOptions();
  renderCategoryList();
  document.getElementById('newCategoryName').value = '';
}

// Render danh sách category trong modal
function renderCategoryList() {
  const ul = document.getElementById('categoryList');
  if (!ul) return;
  ul.innerHTML = categories.map(c =>
    `<li class="list-group-item d-flex justify-content-between align-items-center">
      <span>${c.name}</span>
      <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})">Xóa</button>
    </li>`
  ).join('');
}

// Xóa category (chỉ khi không có sản phẩm nào dùng)
function deleteCategory(id) {
  if (products.some(p => p.category?.id == id)) {
    alert('Không thể xóa category đang được sử dụng!');
    return;
  }
  categories = categories.filter(c => c.id != id);
  renderCategoryOptions();
  renderCategoryList();
}

// Bổ sung: Khi thêm/sửa category, cập nhật lại select trong modal sản phẩm nếu đang mở
document.getElementById('categoryModal')?.addEventListener('hidden.bs.modal', renderCategoryOptions);
