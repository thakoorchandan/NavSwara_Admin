import { useState } from "react";
import assets from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Add = ({ token }) => {
  const [images, setImages] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestSeller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);

  const onDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    setImages((prev) => [...prev, ...imageFiles]);
  };

  const onImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizes));

      images.forEach((img, i) => {
        formData.append(`image${i + 1}`, img);
      });

      const response = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/api/product/add",
        formData,
        { headers: { token } }
      );

      if (response.data.sucsess) {
        toast.success(response.data.message);
        setName("");
        setDescription("");
        setImages([]);
        setPrice("");
        setSizes([]);
        setBestSeller(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col w-full items-start gap-3"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div>
        <p className="mb-2">Upload Images (Drag and drop supported)</p>
        <div className="flex gap-2 flex-wrap border border-dashed border-gray-400 p-4 rounded">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(image)}
                className="w-20 h-20 object-cover"
                alt={`upload-${index}`}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full opacity-75 hover:opacity-100"
              >
                X
              </button>
            </div>
          ))}
          <label className="w-20 h-20 flex items-center justify-center border border-gray-300 cursor-pointer bg-slate-100">
            <span className="text-xl">+</span>
            <input
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={onImageChange}
            />
          </label>
        </div>
      </div>

      {/* ...Other inputs remain the same... */}

      <div className="w-full">
        <p className="mb-2">Product Name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full max-w-[500px] px-3 py-2"
          type="text"
          placeholder="Type Here"
          required
        />
      </div>

      <div className="w-full">
        <p className="mb-2">Product description</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className="w-full max-w-[500px] px-3 py-2"
          placeholder="Write content here"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
        <div>
          <p className="mb-2">Product category</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2"
            value={category}
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Sub category</p>
          <select
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full px-3 py-2"
            value={subCategory}
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Product Price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-3 py-2 sm:w-[120px]"
            type="number"
            placeholder="25"
          />
        </div>
      </div>

      <div>
        <p className="mb-2">Product sizes</p>
        <div className="flex gap-3">
          {["S", "M", "L", "XL", "XXL"].map((size) => (
            <div
              key={size}
              onClick={() =>
                setSizes((prev) =>
                  prev.includes(size)
                    ? prev.filter((s) => s !== size)
                    : [...prev, size]
                )
              }
            >
              <p
                className={`${sizes.includes(size)
                  ? "bg-pink-100"
                  : "bg-slate-200"
                  } px-3 py-1 cursor-pointer`}
              >
                {size}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <input
          onChange={(e) => setBestSeller(e.target.checked)}
          checked={bestseller}
          type="checkbox"
          id="bestseller"
        />
        <label className="cursor-pointer" htmlFor="bestseller">
          Add to Bestseller
        </label>
      </div>

      <button
        type="submit"
        className="w-28 py-3 mt-4 bg-black text-white flex justify-center items-center"
        disabled={loading}
      >
        {loading ? (
          <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white border-solid" />
        ) : (
          "ADD"
        )}
      </button>
    </form>
  );
};

export default Add;
