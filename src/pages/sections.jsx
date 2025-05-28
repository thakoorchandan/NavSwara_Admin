import { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Table,
  Popconfirm,
  InputNumber,
  Switch,
  Tag,
  Tooltip,
  Row,
  Col,
  Divider,
  Image,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-toastify";

const { Title } = Typography;
const { Option } = Select;

export default function Sections({ token }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [form] = Form.useForm();
  const [filter, setFilter] = useState({
    category: "",
    subCategory: "",
    tag: "",
  });
  const [previewProduct, setPreviewProduct] = useState(null);

  useEffect(() => {
    fetchSections();
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/section/admin`,
        { headers: { token } }
      );
      setSections(data.sections);
    } catch (err) {
      toast.error("Failed to fetch sections");
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/product/list?limit=1000`
    );
    setProducts(data.products);
  };

  // For unique order numbers (disable existing except current section's order)
  const getUsedOrders = () => {
    if (!sections) return [];
    return sections
      .filter((s) => !editSection || s._id !== editSection._id)
      .map((s) => s.order);
  };

  // Key fix: always reset fields before setting for a fresh modal state
  const openModal = (section) => {
    setEditSection(section || null);
    setModal(true);
    form.resetFields();
    if (section) {
      form.setFieldsValue({
        ...section,
        productIds: section.productIds.map(String),
      });
    } else {
      // default to next available order
      const maxOrder = sections.length
        ? Math.max(...sections.map((s) => s.order || 0))
        : 0;
      form.setFieldsValue({ order: maxOrder + 1 });
    }
  };

  const handleSubmit = async (values) => {
    // Prevent duplicate order numbers
    if (getUsedOrders().includes(values.order)) {
      toast.error("That order number is already used by another section!");
      return;
    }
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/section/upsert`,
        {
          ...values,
          id: editSection?._id,
        },
        { headers: { token } }
      );
      toast.success("Section saved!");
      setModal(false);
      form.resetFields();
      fetchSections();
    } catch (err) {
      toast.error("Failed to save section");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/section/delete`,
        { id },
        { headers: { token } }
      );
      toast.success("Section deleted");
      fetchSections();
    } catch (err) {
      toast.error("Failed to delete section");
    }
  };

  // Distinct values for filters
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const subCategories = [
    ...new Set(products.map((p) => p.subCategory).filter(Boolean)),
  ];
  const tags = [...new Set(products.flatMap((p) => p.tags).filter(Boolean))];

  // Filter products for selection
  const filteredProducts = products.filter((prod) => {
    return (
      (!filter.category || prod.category === filter.category) &&
      (!filter.subCategory || prod.subCategory === filter.subCategory) &&
      (!filter.tag || (prod.tags || []).includes(filter.tag))
    );
  });

  // For productId => product lookup
  const productMap = Object.fromEntries(products.map((p) => [p._id, p]));

  // Handle Eye Button click for preview
  const handlePreviewProduct = (productId) => {
    setPreviewProduct(productMap[productId]);
  };

  return (
    <Card style={{ maxWidth: 1000, margin: "40px auto" }}>
      <Space style={{ display: "flex", justifyContent: "space-between" }}>
        <Title level={3}>Landing Page Sections</Title>
        <Button type="primary" onClick={() => openModal(null)}>
          + Add Section
        </Button>
      </Space>
      <Table
        dataSource={sections}
        rowKey="_id"
        loading={loading}
        columns={[
          { title: "Title", dataIndex: "title" },
          { title: "Slug", dataIndex: "slug" },
          {
            title: "Active",
            dataIndex: "active",
            render: (v) => (v ? "Yes" : "No"),
          },
          {
            title: "Products",
            dataIndex: "productIds",
            render: (p) => (p?.length ? p.length : "0"),
          },
          { title: "Order", dataIndex: "order" },
          {
            title: "Actions",
            render: (_, rec) => (
              <Space>
                <Button onClick={() => openModal(rec)} size="small">
                  Edit
                </Button>
                <Popconfirm
                  title="Are you sure?"
                  onConfirm={() => handleDelete(rec._id)}
                >
                  <Button size="small" danger>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={false}
        style={{ marginTop: 20 }}
      />

      {/* PRODUCT PREVIEW MODAL */}
      <Modal
        open={!!previewProduct}
        onCancel={() => setPreviewProduct(null)}
        footer={null}
        width={600}
        title={previewProduct?.name || "Product Details"}
      >
        {previewProduct && (
          <div>
            <Row gutter={16}>
              <Col span={10}>
                <Image.PreviewGroup>
                  <Image
                    width={200}
                    src={previewProduct.coverImage?.url}
                    alt={previewProduct.name}
                    style={{ borderRadius: 8, marginBottom: 8 }}
                  />
                  {previewProduct.images?.map((img, i) => (
                    <Image
                      key={i}
                      width={60}
                      src={img.url}
                      style={{ margin: 2 }}
                      alt={`Gallery ${i}`}
                    />
                  ))}
                </Image.PreviewGroup>
              </Col>
              <Col span={14}>
                <div>
                  <strong>Price:</strong> ₹{previewProduct.price}
                </div>
                <div>
                  <strong>Category:</strong> {previewProduct.category}
                </div>
                <div>
                  <strong>SubCategory:</strong> {previewProduct.subCategory}
                </div>
                <div>
                  <strong>Tags:</strong>{" "}
                  {(previewProduct.tags || []).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
                <div>
                  <strong>Brand:</strong> {previewProduct.brand}
                </div>
                <div>
                  <strong>Colors:</strong>{" "}
                  {(previewProduct.color || []).join(", ")}
                </div>
                <div>
                  <strong>Sizes:</strong>{" "}
                  {(previewProduct.sizes || []).join(", ")}
                </div>
                <Divider />
                <div>
                  <strong>Description:</strong>
                  <p style={{ marginTop: 4 }}>{previewProduct.description}</p>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      <Modal
        open={modal}
        title={editSection ? "Edit Section" : "Add Section"}
        onCancel={() => {
          setModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Save"
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Section Title"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>

          {/* FILTER CONTROLS */}
          <Row gutter={8} align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Select
                placeholder="Filter by Category"
                allowClear
                style={{ width: 140 }}
                value={filter.category || undefined}
                onChange={(v) => setFilter((f) => ({ ...f, category: v }))}
              >
                {categories.map((cat) => (
                  <Option value={cat} key={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="Filter by SubCategory"
                allowClear
                style={{ width: 150 }}
                value={filter.subCategory || undefined}
                onChange={(v) => setFilter((f) => ({ ...f, subCategory: v }))}
              >
                {subCategories.map((sc) => (
                  <Option value={sc} key={sc}>
                    {sc}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="Filter by Tag"
                allowClear
                style={{ width: 130 }}
                value={filter.tag || undefined}
                onChange={(v) => setFilter((f) => ({ ...f, tag: v }))}
              >
                {tags.map((t) => (
                  <Option value={t} key={t}>
                    {t}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Button
                onClick={() =>
                  setFilter({ category: "", subCategory: "", tag: "" })
                }
              >
                Reset
              </Button>
            </Col>
          </Row>

          <Form.Item name="productIds" label="Products">
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="children"
              placeholder="Select products to show in this section"
              maxTagCount={6}
              maxTagPlaceholder={(omittedValues) =>
                `+${omittedValues.length} more`
              }
              optionLabelProp="label"
            >
              {filteredProducts.map((prod) => (
                <Option
                  key={prod._id}
                  value={prod._id}
                  label={
                    <div className="flex items-center gap-1">
                      <span>{prod.name}</span>
                      <Tooltip title="View Product">
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          size="small"
                          style={{ padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewProduct(prod._id);
                          }}
                        />
                      </Tooltip>
                    </div>
                  }
                >
                  <div>
                    <b>{prod.name}</b>
                    <div style={{ fontSize: 11, color: "#555" }}>
                      {prod.category && <>Cat: {prod.category} &nbsp;</>}
                      {prod.subCategory && <>Sub: {prod.subCategory} &nbsp;</>}
                      {prod.tags && prod.tags.length > 0 && (
                        <>
                          Tags:{" "}
                          {prod.tags.map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="image" label="Section Banner (optional)">
            <Input placeholder="URL to banner image" />
          </Form.Item>
          <Form.Item
            name="order"
            label="Section Order"
            tooltip="Lower numbers appear first"
            rules={[
              {
                validator: (_, value) =>
                  value === 0 || value
                    ? Promise.resolve()
                    : Promise.reject(new Error("Section order is required")),
              },
              { type: "number", min: 0, message: "Order must be 0 or higher" },
            ]}
          >
            <InputNumber min={0} style={{ width: 150 }} />
            <div style={{ fontSize: 12, color: "#cf1322" }}>
              {form.getFieldValue("order") !== undefined &&
                getUsedOrders().includes(form.getFieldValue("order")) && (
                  <>This order number is already used by another section.</>
                )}
            </div>
          </Form.Item>
          <Form.Item
            name="active"
            label="Active"
            valuePropName="checked"
            // No initialValue, state is always controlled via setFieldsValue or resetFields
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
