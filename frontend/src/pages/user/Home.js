import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const Home = () => {
  return (
    <>
      <Header />
      
      {/* Banner + lời chào */}
      <div
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1350&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "5rem 2rem",
          color: "white",
          textAlign: "center",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          boxShadow: "inset 0 0 0 1000px rgba(0,0,0,0.4)",
        }}
      >
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", fontWeight: "bold" }}>
          Chào mừng tới Nhà hàng Hải sản Việt Nam
        </h1>
        <p style={{ fontSize: "1.25rem" }}>
          Thưởng thức những món hải sản tươi ngon nhất!
        </p>
      </div>

      <Footer />
    </>
  );
};

export default Home;
