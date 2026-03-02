import React from "react";
import HomePage from "../pages/index";

const Layout = () => {
  // Đã gỡ bỏ toàn bộ "vỏ bọc" Zalo (ZMPRouter, App, SnackbarProvider)
  // Chỉ render trực tiếp trang chủ để chạy được trên mọi trình duyệt web!
  return (
    <>
      <HomePage />
    </>
  );
};

export default Layout;