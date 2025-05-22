// admin/src/pages/Orders.jsx

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import {
  Input,
  Select,
  DatePicker,
  Table,
  Button,
  Space,
  Badge,
  Slider,
  Modal,
  Row,
  Col,
  Card,
  message,
} from "antd";
import {
  SearchOutlined,
  IdcardOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  FilterOutlined,
  CalendarOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  Table as WordTable,
  TableRow,
  TableCell,
} from "docx";
import "jspdf-autotable";

const { RangePicker } = DatePicker;
const { Option } = Select;

const statusBadge = {
  "Order Placed": { status: "processing", text: "Order Placed" },
  Packing: { status: "processing", text: "Packing" },
  Shipped: { status: "processing", text: "Shipped" },
  "Out for delivery": { status: "warning", text: "Out for Delivery" },
  Delivered: { status: "success", text: "Delivered" },
  Cancelled: { status: "error", text: "Cancelled" },
};

export default function Orders({ token }) {
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalItems, setModalItems] = useState([]);

  // Filters
  const [globalSearch, setGlobalSearch] = useState("");
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productFilter, setProductFilter] = useState([]);
  const [priceRangeFilter, setPriceRangeFilter] = useState([0, 0]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState(null);
  const [dateRange, setDateRange] = useState([]);

  // Fetch orders
  useEffect(() => {
    if (!token) return;
    setLoadingData(true);
    axios
      .post(`${backendUrl}/api/order/list`, {}, { headers: { token } })
      .then(({ data }) => {
        if (data.success) setOrders(data.orders.reverse());
        else message.error(data.message);
      })
      .catch((err) => message.error(err.message))
      .finally(() => setLoadingData(false));
  }, [token]);

  // Unique product names
  const allProductNames = useMemo(() => {
    const names = orders.flatMap((o) => o.items.map((it) => it.name));
    return Array.from(new Set(names)).map((n) => ({ label: n, value: n }));
  }, [orders]);

  // Min/max total
  const [minAmount, maxAmount] = useMemo(() => {
    if (!orders.length) return [0, 0];
    const vals = orders.map((o) => o.totalAmount);
    return [Math.min(...vals), Math.max(...vals)];
  }, [orders]);

  useEffect(() => {
    if (maxAmount > 0) setPriceRangeFilter([minAmount, maxAmount]);
  }, [minAmount, maxAmount]);

  const handleStatusChange = (orderId, newStatus) => {
    axios
      .post(
        `${backendUrl}/api/order/status`,
        { orderId, status: newStatus },
        { headers: { token } }
      )
      .then(({ data }) => {
        if (data.success) {
          message.success("Order status updated");
          setOrders((prev) =>
            prev.map((o) =>
              o._id === orderId ? { ...o, status: newStatus } : o
            )
          );
        } else {
          message.error(data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        message.error("Failed to update status");
      });
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const txt = globalSearch.toLowerCase();
      if (
        txt &&
        !(
          o._id.toLowerCase().includes(txt) ||
          o.user.name.toLowerCase().includes(txt) ||
          o.items.some((it) => it.name.toLowerCase().includes(txt)) ||
          String(o.totalAmount).includes(txt)
        )
      )
        return false;
      if (
        orderIdSearch &&
        !o._id.toLowerCase().includes(orderIdSearch.toLowerCase())
      )
        return false;
      if (
        customerSearch &&
        !o.user.name.toLowerCase().includes(customerSearch.toLowerCase())
      )
        return false;
      if (
        productFilter.length &&
        !o.items.some((it) => productFilter.includes(it.name))
      )
        return false;
      if (
        priceRangeFilter[0] != null &&
        (o.totalAmount < priceRangeFilter[0] ||
          o.totalAmount > priceRangeFilter[1])
      )
        return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (paymentFilter) {
        const paid =
          Boolean(o.paymentDetail?.transactionId) ||
          o.paymentDetail.method !== "COD";
        if (paymentFilter === "paid" && !paid) return false;
        if (paymentFilter === "pending" && paid) return false;
      }
      if (dateRange.length === 2) {
        const d = new Date(o.createdAt);
        if (d < dateRange[0] || d > dateRange[1]) return false;
      }
      return true;
    });
  }, [
    orders,
    globalSearch,
    orderIdSearch,
    customerSearch,
    productFilter,
    priceRangeFilter,
    statusFilter,
    paymentFilter,
    dateRange,
  ]);

  // Table columns
  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "id",
      width: 160,
      ellipsis: true,
    },
    {
      title: "Customer",
      dataIndex: ["user", "name"],
      key: "customer",
      width: 160,
      render: (_, rec) => (
        <div>
          {rec.user.name}
          <br />
          <span className="text-gray-500">{rec.user.email}</span>
        </div>
      ),
    },
    {
      title: "Address",
      key: "address",
      width: 220,
      render: (_, rec) => {
        const a = rec.shippingAddress;
        return (
          <div className="text-sm">
            {a.fullName}
            <br />
            {a.line1}
            {a.line2 && `, ${a.line2}`}
            <br />
            {a.city}, {a.state} {a.postalCode}
            <br />
            {a.country}
            <br />
            {a.phone && `📞 ${a.phone}`}
          </div>
        );
      },
    },
    {
      title: "Items",
      key: "items",
      width: 100,
      render: (_, rec) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            setModalItems(rec.items);
            setModalVisible(true);
          }}
        >
          View ({rec.items.length})
        </Button>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "total",
      width: 100,
      render: (v) => (
        <span>
          <DollarOutlined /> {currency}
          {v}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      filters: Object.keys(statusBadge).map((s) => ({
        text: statusBadge[s].text,
        value: s,
      })),
      onFilter: (val, rec) => rec.status === val,
      render: (s) => {
        const b = statusBadge[s] || { status: "default", text: s };
        return <Badge status={b.status} text={b.text} />;
      },
    },
    {
      title: "Change Status",
      key: "changeStatus",
      width: 180,
      render: (_, record) => (
        <Select
          defaultValue={record.status}
          style={{ width: 160 }}
          onSelect={(val) => handleStatusChange(record._id, val)}
        >
          {Object.keys(statusBadge).map((statusKey) => (
            <Option key={statusKey} value={statusKey}>
              {statusBadge[statusKey].text}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Paid",
      key: "paid",
      width: 100,
      filters: [
        { text: "Paid", value: "paid" },
        { text: "Pending", value: "pending" },
      ],
      onFilter: (val, rec) => {
        const paid =
          Boolean(rec.paymentDetail?.transactionId) ||
          rec.paymentDetail.method !== "COD";
        return val === "paid" ? paid : !paid;
      },
      render: (_, rec) => {
        const paid =
          Boolean(rec.paymentDetail?.transactionId) ||
          rec.paymentDetail.method !== "COD";
        return (
          <Badge
            status={paid ? "success" : "error"}
            text={paid ? "Paid" : "Pending"}
          />
        );
      },
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      width: 160,
      render: (d) => (
        <>
          <CalendarOutlined /> {new Date(d).toLocaleString()}
        </>
      ),
    },
  ];

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    const head = [
      [
        "Order ID",
        "Customer",
        "Email",
        "Address",
        "Items",
        "Total",
        "Status",
        "Paid",
        "Date",
      ],
    ];
    const body = filteredOrders.map((o) => {
      const paid =
        Boolean(o.paymentDetail?.transactionId) ||
        o.paymentDetail.method !== "COD"
          ? "Yes"
          : "No";
      const a = o.shippingAddress;
      const addr = `${a.fullName}, ${a.line1}${
        a.line2 ? `, ${a.line2}` : ""
      }, ${a.city}, ${a.state}-${a.postalCode}, ${a.country}, ${a.phone}`;
      const items = o.items
        .map(
          (it) =>
            `${it.name} x${it.quantity} (Size: ${it.selectedSize}${
              it.selectedColor ? `, Color: ${it.selectedColor}` : ""
            })`
        )
        .join("; ");
      return [
        o._id,
        o.user.name,
        o.user.email,
        addr,
        items,
        `${currency}${o.totalAmount}`,
        o.status,
        paid,
        new Date(o.createdAt).toLocaleString(),
      ];
    });
    autoTable(doc, { head, body, startY: 20, styles: { fontSize: 8 } });
    doc.save("orders.pdf");
  };

  // Export Excel
  const exportExcel = () => {
    const data = filteredOrders.map((o) => {
      const paid =
        Boolean(o.paymentDetail?.transactionId) ||
        o.paymentDetail.method !== "COD"
          ? "Yes"
          : "No";
      const a = o.shippingAddress;
      const addr = `${a.fullName}, ${a.line1}${
        a.line2 ? `, ${a.line2}` : ""
      }, ${a.city}, ${a.state}-${a.postalCode}, ${a.country}, ${a.phone}`;
      const items = o.items
        .map(
          (it) =>
            `${it.name} x${it.quantity} (Size: ${it.selectedSize}${
              it.selectedColor ? `, Color: ${it.selectedColor}` : ""
            })`
        )
        .join("; ");
      return {
        "Order ID": o._id,
        Customer: o.user.name,
        Email: o.user.email,
        Address: addr,
        Items: items,
        Total: o.totalAmount,
        Status: o.status,
        Paid: paid,
        Date: new Date(o.createdAt).toLocaleString(),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "orders.xlsx"
    );
  };

  // Export Word
  const exportWord = async () => {
    const headerRow = new TableRow({
      children: [
        "Order ID",
        "Customer",
        "Email",
        "Address",
        "Items",
        "Total",
        "Status",
        "Paid",
        "Date",
      ].map(
        (txt) =>
          new TableCell({
            children: [new Paragraph({ text: txt, bold: true })],
          })
      ),
    });
    const dataRows = filteredOrders.map((o) => {
      const paid =
        Boolean(o.paymentDetail?.transactionId) ||
        o.paymentDetail.method !== "COD"
          ? "Yes"
          : "No";
      const a = o.shippingAddress;
      const addr = `${a.fullName}, ${a.line1}${
        a.line2 ? `, ${a.line2}` : ""
      }, ${a.city}, ${a.state}-${a.postalCode}, ${a.country}, ${a.phone}`;
      const items = o.items
        .map(
          (it) =>
            `${it.name} x${it.quantity} (Size: ${it.selectedSize}${
              it.selectedColor ? `, Color: ${it.selectedColor}` : ""
            })`
        )
        .join("; ");
      return new TableRow({
        children: [
          o._id,
          o.user.name,
          o.user.email,
          addr,
          items,
          `${currency}${o.totalAmount}`,
          o.status,
          paid,
          new Date(o.createdAt).toLocaleString(),
        ].map((txt) => new TableCell({ children: [new Paragraph(txt)] })),
      });
    });
    const doc = new Document({
      sections: [
        { children: [new WordTable({ rows: [headerRow, ...dataRows] })] },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "orders.docx");
  };

  return (
    <>
      {/* Filters */}
      <div className="overflow-x-auto mb-4">
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Global search"
            allowClear
            style={{ width: 200 }}
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
          <Input
            prefix={<IdcardOutlined />}
            placeholder="Order ID"
            allowClear
            style={{ width: 180 }}
            value={orderIdSearch}
            onChange={(e) => setOrderIdSearch(e.target.value)}
          />
          <Input
            prefix={<TeamOutlined />}
            placeholder="Customer name"
            allowClear
            style={{ width: 200 }}
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          <Select
            mode="multiple"
            placeholder="Filter products"
            allowClear
            style={{ width: 220 }}
            options={allProductNames}
            onChange={setProductFilter}
            suffixIcon={<ShoppingCartOutlined />}
          />
          <div style={{ width: 240 }}>
            <span className="block text-sm mb-1">
              Price: ₹{priceRangeFilter[0]} – ₹{priceRangeFilter[1]}
            </span>
            <Slider
              range
              min={minAmount}
              max={maxAmount}
              value={priceRangeFilter}
              onChange={setPriceRangeFilter}
              tooltipPlacement="bottom"
              tooltipFormatter={(val) => `₹${val}`}
            />
          </div>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 160 }}
            onChange={setStatusFilter}
            suffixIcon={<FilterOutlined />}
          >
            {Object.keys(statusBadge).map((s) => (
              <Option key={s} value={s}>
                {statusBadge[s].text}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Payment"
            allowClear
            style={{ width: 160 }}
            onChange={setPaymentFilter}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="paid">Paid</Option>
            <Option value="pending">Pending</Option>
          </Select>
          <RangePicker
            onChange={(dates) => setDateRange(dates || [])}
            allowClear
          />
          <Button icon={<DownloadOutlined />} onClick={exportPDF}>
            PDF
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportExcel}>
            Excel
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportWord}>
            Word
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Table
        rowKey="_id"
        loading={loadingData}
        dataSource={filteredOrders}
        columns={columns}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
        }}
        scroll={{ x: "max-content" }}
      />

      {/* Items Modal */}
      <Modal
        visible={modalVisible}
        title="Order Items"
        footer={<Button onClick={() => setModalVisible(false)}>Close</Button>}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Row gutter={[16, 16]}>
          {modalItems.map((it) => {
            const snap = it.productSnapshot || {};
            return (
              <Col xs={24} sm={12} md={8} key={it.product + it.selectedSize}>
                <Card
                  cover={
                    <img
                      alt={snap.description}
                      src={snap.coverImage?.url}
                      style={{ objectFit: "cover", height: 350 }}
                    />
                  }
                >
                  <Card.Meta
                    title={`${snap.brand} – ${it.name}`}
                    description={
                      <>
                        <p>
                          <strong>Selected Size:</strong> {it.selectedSize}
                          {it.selectedColor && ` / ${it.selectedColor}`}
                        </p>
                        <p>
                          <strong>Qty:</strong> {it.quantity} |{" "}
                          <strong>Unit:</strong> ₹{it.unitPrice} |{" "}
                          <strong>Total:</strong> ₹{it.totalPrice}
                        </p>
                        {snap.tags?.length > 0 && (
                          <p>
                            <strong>Tags:</strong> {snap.tags.join(", ")}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {snap.images?.map((img, i) => (
                            <img
                              key={i}
                              src={img.url}
                              alt={img.alt}
                              className="w-12 h-12 object-cover border"
                            />
                          ))}
                        </div>
                      </>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      </Modal>
    </>
  );
}
