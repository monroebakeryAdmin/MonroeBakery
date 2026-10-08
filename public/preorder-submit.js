// A synchronous lock prevents repeat taps while the order/email request is pending.
(() => {
  const form = document.getElementById('preorderForm');
  const submit = document.getElementById('submitOrder');
  const status = document.getElementById('orderStatus');
  const help = document.getElementById('orderHelp');
  const newOrder = document.getElementById('newOrder');
  let state = 'idle';

  newOrder.addEventListener('click', () => {
    if (state !== 'success') return;
    state = 'idle';
    submit.disabled = false;
    submit.textContent = 'Submit Pre-Order';
    status.textContent = '';
    newOrder.hidden = true;
    document.getElementById('searchBar').focus();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state !== 'idle' || !form.reportValidity()) return;
    if (!Object.keys(cart).length) {
      status.textContent = 'Please add at least one item to your order.';
      return;
    }
    if (!dateField.value || dateField.value < dateField.min || dateField.value > dateField.max) {
      status.textContent = 'Please choose a pickup date between 1 and 21 days from today.';
      return;
    }

    const data = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      items: Object.entries(cart).map(([item, quantity]) => `${item} ×${quantity}`).join(', '),
      dateNeeded: dateField.value,
      message: document.getElementById('message').value.trim()
    };
    if (!data.name || !data.email || !/^[0-9]{10}$/.test(data.phone)) {
      status.textContent = 'Please enter your name, email, and a 10-digit phone number.';
      return;
    }
    if (window.location.protocol === 'file:') {
      status.textContent = 'This local preview cannot submit orders. Please place your order on our live website or call (313) 561-5400.';
      return;
    }

    state = 'sending';
    const controls = [...form.querySelectorAll('input, select, textarea, button')];
    const disabledBefore = controls.map(control => control.disabled);
    controls.forEach(control => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Sending your order…';
    status.textContent = 'Sending your order. Please keep this page open; you only need to tap once.';
    help.hidden = true;
    const slowNotice = setTimeout(() => {
      status.textContent = 'Your order is still processing. Please do not submit again. We’re waiting for confirmation.';
      help.hidden = false;
    }, 15000);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      // These responses are returned before an order is saved, so retrying is safe.
      if (response.status === 400 || response.status === 503) {
        state = 'idle';
        status.textContent = response.status === 400
          ? 'Your order was not submitted. Please check all required details and try again.'
          : 'We couldn’t save your order right now. Please try again in a moment or call (313) 561-5400.';
      } else if (!response.ok) {
        throw new Error('Order outcome unknown');
      } else {
        state = 'success';
        cart = {};
        renderCart();
        form.reset();
        status.textContent = 'Thank you! Your pre-order has been received. We’ll confirm the details by email or text.';
        newOrder.hidden = false;
      }
    } catch (_) {
      // The server may already have saved the order before an email/network failure.
      // Do not encourage a retry that could create another order and email.
      state = 'uncertain';
      status.textContent = 'We couldn’t confirm the result. Your order may already have been received. Your details are still here.';
      help.hidden = false;
    } finally {
      clearTimeout(slowNotice);
      form.removeAttribute('aria-busy');
      controls.forEach((control, index) => { control.disabled = disabledBefore[index]; });
      submit.disabled = state !== 'idle';
      submit.textContent = state === 'success' ? 'Order Received' : state === 'uncertain' ? 'Please Call to Confirm' : 'Submit Pre-Order';
      if (state !== 'uncertain') help.hidden = true;
    }
  });
})();
