import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function AdminPage() {
  const [complaints, setComplaints] = useState([]);
  const navigate = useNavigate();
  const [filteredComplaints, setFilteredComplaints] = useState([]); 
  const [filter, setFilter] = useState("all"); 
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!isAdmin) {
      toast.error("Access denied: Admins only");
      navigate("/");
    } else {
      fetchComplaints();
    }
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/complaints/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("✅ Received complaints:", res.data);
      setComplaints(res.data);
      applyFilter(res.data, filter);
    } catch (err) {
      toast.error("Failed to load complaints");
      console.error(err);
    }
  };
  const applyFilter = (all, selected) => {
    if (selected === "all") {
      setFilteredComplaints(all);
    } else {
      setFilteredComplaints(all.filter((c) => c.status === selected));
    }
  };
  useEffect(() => {
    applyFilter(complaints, filter);
  }, [filter, complaints]);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/complaints/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Complaint deleted");
      fetchComplaints(); // Refresh list
    } catch (err) {
      toast.error("Failed to delete complaint");
      console.error(err);
    }
  };
  const markAsResolved = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await axios.put(`http://localhost:5000/api/complaints/${id}/resolve`, {}, { headers });
      toast.success("Marked as resolved");
      fetchComplaints(); // Refresh the list
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: 15,
          padding: "8px 12px",
          backgroundColor: "#555",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        ⬅️ Exit Admin Panel
      </button>
      <h2>🛠️ Admin Panel - All Complaints</h2>
      <div style={{ marginBottom: "15px" }}>
        <label>Status Filter: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      {filteredComplaints.length === 0 ? (
        <p>No complaints available</p>
      ) : (
        <ul>
          {filteredComplaints.map((c) => (
            <li
              key={c._id}
              style={{
                marginBottom: "1rem",
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "8px",
                position: "relative",
                opacity: c.status === "resolved" ? 0.6 : 1, 
                textDecoration: c.status === 'resolved' ? 'line-through' : 'none',
              }}
            >
              <strong
              >
                {c.title}
              </strong>{" "}
              — Room {c.room}
              <br />
              <em
                
              >
                {c.description}
              </em>
              <br />
              <small>{new Date(c.date).toLocaleString()}</small>
              <br />
              <button
                onClick={() => handleDelete(c._id)}
                style={{
                  marginTop: 10,
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
              {c.status === "pending" && (
                <button
                  onClick={() => markAsResolved(c._id)}
                  style={{
                    marginTop: 10,
                    background: "green",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Mark as Resolved
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminPage;
