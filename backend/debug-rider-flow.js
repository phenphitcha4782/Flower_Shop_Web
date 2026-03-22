async function callJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function run() {
  const base = 'http://localhost:3000';

  const login = await callJson(`${base}/api/employee/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'meow', password: 'meow' }),
  });
  console.log('LOGIN:', login.status, login.data);

  const shipping = await callJson(`${base}/api/order/branches/1?status=shipping`);
  console.log('SHIPPING:', shipping.status, Array.isArray(shipping.data) ? shipping.data.map((o) => ({ order_id: o.order_id, order_code: o.order_code, order_status: o.order_status })) : shipping.data);

  if (Array.isArray(shipping.data) && shipping.data.length > 0) {
    const orderId = shipping.data[0].order_id;

    const accept = await callJson(`${base}/api/delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, employee_id: 3 }),
    });
    console.log('ACCEPT:', accept.status, accept.data);

    const my = await callJson(`${base}/api/delivery/employee/3`);
    console.log('MY_TASKS:', my.status, Array.isArray(my.data) ? my.data.map((t) => ({ order_id: t.order_id, delivery_status: t.delivery_status })) : my.data);
  }
}

run().catch((err) => {
  console.error('DEBUG_FLOW_ERROR:', err);
  process.exit(1);
});
