async function createTask() {
  const title = document.getElementById('taskTitle')?.value?.trim();
  const description = document.getElementById('taskDesc')?.value?.trim();
  const category = document.getElementById('taskCategory')?.value;
  const budget = Number(document.getElementById('taskBudget')?.value);
  const deadline = document.getElementById('taskDeadline')?.value;
  const skillsRaw = document.getElementById('taskSkills')?.value;
  const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!title || !description || !category || !budget || !deadline) {
    showToast('Заполните все обязательные поля', 'error'); return;
  }

  try {
    const task = await apiAuth('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, category, budget, deadline, skills })
    });
    showToast('Задание опубликовано! 🚀', 'success');
    closeModal('createTaskModal');
    window.location.href = `task-detail.html?id=${task._id}`;
  } catch(e) {
    showToast(e.message || 'Ошибка при создании', 'error');
  }
}