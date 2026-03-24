import { Row, Col, FloatingLabel, Form } from "react-bootstrap";

const OrderFilters = ({
  tableFilter,
  setTableFilter,
  dateFilter,
  setDateFilter,
}) => (
  <div className="chef-orders-filter-fields">
    <Row className="g-3">
      <Col xs={12} md={6} lg={5}>
        <FloatingLabel controlId="chef-order-table" label="Số bàn">
          <Form.Control
            type="text"
            inputMode="search"
            autoComplete="off"
            placeholder=" "
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          />
        </FloatingLabel>
      </Col>
      <Col xs={12} md={6} lg={5}>
        <FloatingLabel controlId="chef-order-date" label="Ngày">
          <Form.Control
            type="date"
            value={dateFilter || ""}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </FloatingLabel>
      </Col>
    </Row>
  </div>
);

export default OrderFilters;
