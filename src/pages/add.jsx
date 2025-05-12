// src/pages/Add.jsx
import { useState } from "react";
import {
  ConfigProvider,
  Form,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Upload,
  Button,
  Card,
  Row,
  Col,
  Image,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { InboxOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-toastify";

const { Dragger } = Upload;
const { Title, Text } = Typography;
const categoryOptions = ["Men", "Women", "Kids"];
const subCategoryOptions = ["Topwear", "Bottomwear", "Winterwear"];
const sizeOptions = ["S", "M", "L", "XL", "XXL"];

const getBase64 = (file, cb) => {
  const r = new FileReader();
  r.readAsDataURL(file);
  r.onload = () => cb(r.result);
};

export default function Add({ token }) {
  const [form] = Form.useForm();
  const [coverList, setCoverList] = useState([]);
  const [otherList, setOtherList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleCoverChange = ({ fileList }) => {
    fileList.forEach((f) => {
      if (f.originFileObj && !f.preview) {
        getBase64(f.originFileObj, (url) => {
          f.preview = url;
          setCoverList([...fileList]);
        });
      }
    });
    setCoverList(fileList);
  };

  const handleOtherChange = ({ fileList }) => {
    fileList.forEach((f) => {
      if (f.originFileObj && !f.preview) {
        getBase64(f.originFileObj, (url) => {
          f.preview = url;
          setOtherList([...fileList]);
        });
      }
    });
    setOtherList(fileList);
  };

  const onFinish = async (values) => {
    if (!coverList.length) {
      return toast.error("Please upload a cover image");
    }
    setUploading(true);

    const fd = new FormData();
    // fields...
    fd.append("name", values.name);
    fd.append("description", values.description);
    fd.append("price", values.price);
    fd.append("category", values.category);
    fd.append("subCategory", values.subCategory);
    fd.append("sizes", JSON.stringify(values.sizes));
    fd.append("tags", JSON.stringify(values.tags));
    fd.append("color", JSON.stringify(values.colors || []));
    fd.append("bestSeller", values.bestSeller);
    fd.append("inStock", values.inStock);

    // coverImage:
    fd.append("coverImage", coverList[0].originFileObj);

    // other images:
    otherList.forEach((f, idx) => {
      fd.append(`images`, f.originFileObj);
    });

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/add`,
        fd,
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        form.resetFields();
        setCoverList([]);
        setOtherList([]);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ConfigProvider componentSize="large">
      <Card
        title={<Title level={3}>Add New Product</Title>}
        style={{ maxWidth: 800, margin: "40px auto" }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* coverImage */}
          <Form.Item
            label="Cover Image"
            rules={[
              {
                validator: () =>
                  coverList.length
                    ? Promise.resolve()
                    : Promise.reject("Upload cover image"),
              },
            ]}
          >
            <Dragger
              accept="image/*"
              maxCount={1}
              fileList={coverList}
              onChange={handleCoverChange}
              onRemove={() => setCoverList([])}
              beforeUpload={() => false}
              listType="picture-card"
            >
              <InboxOutlined style={{ fontSize: 24 }} />
              <div>Click or drag to upload cover</div>
            </Dragger>
          </Form.Item>

          {/* otherImages */}
          <Form.Item label="Other Images">
            <Dragger
              accept="image/*"
              multiple
              fileList={otherList}
              onChange={handleOtherChange}
              onRemove={(f) =>
                setOtherList((list) => list.filter((x) => x.uid !== f.uid))
              }
              beforeUpload={() => false}
              listType="picture-card"
            >
              <InboxOutlined style={{ fontSize: 24 }} />
              <div>Upload additional images</div>
            </Dragger>
          </Form.Item>

          {/* name, price, desc, category... */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true }]}
              >
                <Select
                  options={categoryOptions.map((c) => ({ label: c, value: c }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="subCategory"
                label="Sub-Category"
                rules={[{ required: true }]}
              >
                <Select
                  options={subCategoryOptions.map((s) => ({
                    label: s,
                    value: s,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="sizes" label="Sizes" rules={[{ required: true }]}>
            <Checkbox.Group
              options={sizeOptions.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="tags" label="Tags" rules={[{ required: true }]}>
                <Select mode="tags" placeholder="e.g. summer" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="brand" label="Brand">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="colors" label="Colors">
            <Select mode="tags" placeholder="e.g. red" />
          </Form.Item>

          <Row gutter={16} align="middle">
            <Col>
              <Form.Item name="bestSeller" valuePropName="checked">
                <Checkbox>Bestseller</Checkbox>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="inStock" valuePropName="checked" initialValue>
                <Checkbox>In Stock</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Tooltip title={coverList.length === 0 ? "Upload cover image" : ""}>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                block
              >
                Submit
              </Button>
            </Tooltip>
          </Form.Item>
        </Form>
      </Card>
    </ConfigProvider>
  );
}
