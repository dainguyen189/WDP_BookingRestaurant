import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils } from "@fortawesome/free-solid-svg-icons";
import "./css/MenuItemCard.css";

function MenuItemCard({ item }) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = item.image?.startsWith("http")
    ? item.image
    : item.image
      ? `http://localhost:8080/uploads/${item.image}`
      : null;

  const showImage = Boolean(imageUrl && !imageFailed);

  return (
    <article
      className={`menu-card${!item.isAvailable ? " menu-card--unavailable" : ""}`}
    >
      <div className="menu-card-media">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            className="menu-card-img"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="menu-card-placeholder" aria-hidden>
            <FontAwesomeIcon
              icon={faUtensils}
              className="menu-card-placeholder-icon"
            />
          </div>
        )}
        {!item.isAvailable && <span className="menu-card-badge">Hết món</span>}
      </div>
      <div className="menu-card-body">
        <div className="menu-card-header">
          <h2 className="menu-card-title">{item.name}</h2>
          {item.description ? (
            <p className="menu-card-desc">{item.description}</p>
          ) : null}
        </div>
        <div className="menu-card-footer">
          <div className="menu-card-price">
            {item.price.toLocaleString("vi-VN")}₫
          </div>
        </div>
      </div>
    </article>
  );
}

export default MenuItemCard;
