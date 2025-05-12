// src/pages/List.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Space,
  Image,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Checkbox,
  Tag,
  Tooltip,
  message,
  Popconfirm,
  Grid,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ManOutlined,
  WomanOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { currency } from "../App";

const { useBreakpoint } = Grid;
const categoryOptions = ["Men", "Women", "Kids"];
const subCategoryOptions = ["Topwear", "Bottomwear", "Winterwear"];
const sizeOptions = ["S", "M", "L", "XL", "XXL"];

const List = ({ token }) => {
  const screens = useBreakpoint();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [coverEditList, setCoverEditList] = useState([]);
  const [editFileList, setEditFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/list`
      );
      setList(res.data.products || []);
    } catch (err) {
      message.error(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchList();
  }, []);

  const removeProduct = async (id) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/remove`,
        { id },
        { headers: { token } }
      );
      if (res.data.success) {
        message.success(res.data.message);
        fetchList();
      } else {
        message.error(res.data.message);
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showEditModal = (record) => {
    setEditingProduct(record);
    form.setFieldsValue({
      name: record.name,
      price: record.price,
      description: record.description,
      category: record.category,
      subCategory: record.subCategory,
      brand: record.brand,
      colors: record.color,
      sizes: record.sizes,
      tags: record.tags,
      bestSeller: record.bestSeller,
      inStock: record.inStock,
    });
    setCoverEditList(
      record.coverImage
        ? [
            {
              uid: record.coverImage.url,
              name: "Cover",
              status: "done",
              url: record.coverImage.url,
            },
          ]
        : []
    );
    setEditFileList(
      (record.images || []).map((img, idx) => ({
        uid: img.url + idx,
        name: `Img ${idx + 1}`,
        status: "done",
        url: img.url,
      }))
    );
    setIsEditModalOpen(true);
  };

  const handleCoverChange = ({ fileList }) => setCoverEditList(fileList);
  const handleOtherChange = ({ fileList }) => setEditFileList(fileList);

  const handleImagePreview = async (file) => {
    let src = file.url;
    if (!src && file.originFileObj) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    setPreviewImage(src);
    setPreviewTitle(file.name || src);
    setPreviewOpen(true);
  };

  const handleUpdate = async (values) => {
    try {
      const id = editingProduct._id;
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined) {
          fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
        }
      });
      if (coverEditList[0]?.originFileObj) {
        fd.append("coverImage", coverEditList[0].originFileObj);
      } else if (coverEditList[0]?.url) {
        fd.append("existingCoverImage", JSON.stringify(coverEditList[0].url));
      }
      const existing = editFileList
        .filter((f) => !f.originFileObj)
        .map((f) => f.url);
      if (existing.length)
        fd.append("existingImages", JSON.stringify(existing));
      editFileList
        .filter((f) => f.originFileObj)
        .forEach((f) => fd.append("images", f.originFileObj));

      const res = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/update/${id}`,
        fd,
        { headers: { token, "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        message.success(res.data.message);
        setIsEditModalOpen(false);
        fetchList();
      } else {
        message.error(res.data.message);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const categoryTag = (cat) => {
    switch (cat) {
      case "Men":
        return (
          <Tag icon={<ManOutlined />} color="blue">
            Men
          </Tag>
        );
      case "Women":
        return (
          <Tag icon={<WomanOutlined />} color="magenta">
            Women
          </Tag>
        );
      case "Kids":
        return (
          <Tag icon={<SmileOutlined />} color="green">
            Kids
          </Tag>
        );
      default:
        return <Tag>{cat}</Tag>;
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const columns = [
    {
      title: "Cover",
      dataIndex: ["coverImage", "url"],
      key: "cover",
      render: (url) =>
        url && (
          <Image
            width={50}
            src={url}
            preview={false}
            style={{ cursor: "pointer" }}
            onClick={() => handleImagePreview({ url, name: "Cover" })}
          />
        ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: categoryTag,
      filters: categoryOptions.map((c) => ({ text: c, value: c })),
      onFilter: (value, rec) => rec.category === value,
    },
    {
      title: "Sub-Category",
      dataIndex: "subCategory",
      key: "subCategory",
      sorter: (a, b) => a.subCategory.localeCompare(b.subCategory),
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
      sorter: (a, b) => (a.brand || "").localeCompare(b.brand || ""),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (p) => `${currency}${p}`,
    },
    {
      title: "Bestseller",
      dataIndex: "bestSeller",
      key: "bestSeller",
      sorter: (a, b) =>
        a.bestSeller === b.bestSeller ? 0 : a.bestSeller ? -1 : 1,
      render: (bs) => (bs ? "Yes" : "No"),
    },
    {
      title: "In Stock",
      dataIndex: "inStock",
      key: "inStock",
      sorter: (a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1),
      render: (is) => (is ? "Yes" : "No"),
    },
    {
      title: "Posted On",
      dataIndex: "createdAt",
      key: "postedOn",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: formatDate,
    },
    {
      title: "Updated On",
      dataIndex: "updatedAt",
      key: "updatedOn",
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
      render: formatDate,
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags) => (tags || []).map((tag) => <Tag key={tag}>{tag}</Tag>),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, rec) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showEditModal(rec)} />
          <Popconfirm
            title="Delete this product?"
            onConfirm={() => removeProduct(rec._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <h2>All Products</h2>
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={list}
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: "max-content" }}
      />

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img
          alt="Preview"
          src={previewImage}
          style={{ width: "100%", objectFit: "contain", maxHeight: "80vh" }}
        />
      </Modal>

      <Modal
        title="Edit Product"
        open={isEditModalOpen}
        width={screens.xs ? "90%" : 800}
        destroyOnClose
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() =>
          form
            .validateFields()
            .then((values) => handleUpdate(values))
            .catch(({ errorFields }) => form.scrollToField(errorFields[0].name))
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Cover Image">
            <Upload
              listType="picture-card"
              accept="image/*"
              maxCount={1}
              fileList={coverEditList}
              onChange={handleCoverChange}
              onPreview={handleImagePreview}
              beforeUpload={() => false}
            >
              <PlusOutlined />
            </Upload>
          </Form.Item>

          <Form.Item label="Other Images">
            <Upload
              listType="picture-card"
              accept="image/*"
              fileList={editFileList}
              onChange={handleOtherChange}
              onPreview={handleImagePreview}
              beforeUpload={() => false}
              multiple
            >
              <PlusOutlined />
            </Upload>
          </Form.Item>

          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true }]}
          >
            <Select
              options={categoryOptions.map((c) => ({ label: c, value: c }))}
            />
          </Form.Item>
          <Form.Item
            name="subCategory"
            label="Sub-Category"
            rules={[{ required: true }]}
          >
            <Select
              options={subCategoryOptions.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
          <Form.Item name="brand" label="Brand">
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Select mode="tags" />
          </Form.Item>
          <Form.Item name="colors" label="Colors">
            <Select mode="tags" />
          </Form.Item>
          <Form.Item name="sizes" label="Sizes">
            <Checkbox.Group
              options={sizeOptions.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
          <Form.Item name="bestSeller" valuePropName="checked">
            <Checkbox>Bestseller</Checkbox>
          </Form.Item>
          <Form.Item name="inStock" valuePropName="checked">
            <Checkbox>In Stock</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default List;
