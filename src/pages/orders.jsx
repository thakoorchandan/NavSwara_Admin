// admin/src/pages/orders.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { InboxOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { Badge } from "antd";
import assets from "../assets/assets";

const statusBadge = {
  "Order Placed":   { status: "processing", text: "Order Placed" },
  Packing:          { status: "processing", text: "Packing" },
  Shipped:          { status: "processing", text: "Shipped" },
  "Out for delivery": { status: "warning",    text: "Out for Delivery" },
  Delivered:        { status: "success",    text: "Delivered" },
  Cancelled:        { status: "error",      text: "Cancelled" },
};

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    if (!token) return;
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        { headers: { token } }
      );
      if (data.success) {
        setOrders(data.orders.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const statusHandler = async (e, orderId) => {
    try {
      await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: e.target.value },
        { headers: { token } }
      );
      fetchAllOrders();
    } catch {
      toast.error("Failed to update order status.");
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  if (!orders.length) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 text-center text-gray-600">
        <InboxOutlined style={{ fontSize: 64, color: "#d1d5db" }} />
        <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
        <p className="text-sm">
          You haven't received any orders. Once customers place orders,
          they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const {
          _id,
          user,
          items,
          shippingAddress,
          paymentDetail,
          status,
          createdAt,
          totalAmount,
          amount,
        } = order;

        const addr = shippingAddress || order.address || {};
        const paymentMethod =
          paymentDetail?.method || order.paymentMethod || "N/A";
        // paymentDetail.transactionId is set only after verification
        const paid =
          Boolean(paymentDetail?.transactionId) ||
          Boolean(order.payment); 
        const amt = totalAmount ?? amount;

        const badge = statusBadge[status] || { status: "default", text: status };

        return (
          <div
            key={_id}
            className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 rounded"
          >
            {/* Icon */}
            <img
              className="w-12"
              src={assets.parcel_icon}
              alt="Parcel"
            />

            {/* Items & Customer */}
            <div>
              <div className="mb-2">
                {items.map((it, i) => (
                  <span key={i} className="text-sm">
                    {it.name} x{it.quantity}
                    {i < items.length - 1 && ", "}
                  </span>
                ))}
              </div>
              <p className="font-medium">
                {user?.name} <span className="text-gray-500">({user?.email})</span>
              </p>
              <div className="text-sm text-gray-600">
                <p>{addr.fullName}</p>
                <p>
                  {addr.line1}
                  {addr.line2 && `, ${addr.line2}`}
                </p>
                <p>
                  {addr.city}, {addr.state}, {addr.postalCode}
                </p>
                <p>
                  {addr.country}
                </p>
                {addr.phone && <p>📞 {addr.phone}</p>}
              </div>
            </div>

            {/* Counts, Payment & Date */}
            <div className="space-y-1 text-sm">
              <p>Items: {items.length}</p>
              <p>Method: {paymentMethod}</p>
              <p>
                Payment:{" "}
                <Badge
                  status={paid ? "success" : "error"}
                  text={paid ? "Done" : "Pending"}
                />
              </p>
              <p>Date: {new Date(createdAt).toLocaleDateString()}</p>
            </div>

            {/* Amount */}
            <div className="font-medium">
              {currency}
              {amt}
            </div>

            {/* Status selector */}
            <select
              value={status}
              onChange={(e) => statusHandler(e, _id)}
              className="p-2 border rounded text-sm"
            >
              {Object.keys(statusBadge).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Status badge */}
            <Badge
              className="mt-2 lg:mt-0"
              status={badge.status}
              text={badge.text}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Orders;
