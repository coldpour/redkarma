document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    document.querySelectorAll('.show-item[data-date]').forEach((item) => {
        const dateValue = item.dataset.date;
        if (!dateValue) {
            return;
        }

        const showDate = new Date(`${dateValue}T00:00:00`);
        if (Number.isNaN(showDate.getTime())) {
            return;
        }

        if (showDate < today) {
            item.classList.add('is-past');
        } else if (showDate > today) {
            item.classList.add('is-future');
        }
    });
});
