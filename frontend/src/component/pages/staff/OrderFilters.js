import { FloatingLabel, Form } from 'react-bootstrap';

const OrderFilters = ({ tableFilter, setTableFilter, dateFilter, setDateFilter }) => (
  <Form className="p-4 shadow-sm rounded" style={{ backgroundColor: "#2a2a2a" }}>
    <FloatingLabel controlId="table" label="Số bàn">
      <Form.Control type="input" value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} />
    </FloatingLabel>
    <FloatingLabel controlId="date" label="Ngày">
      <Form.Control type="date" value={dateFilter || ''} onChange={(e) => setDateFilter(e.target.value)} />
    </FloatingLabel>
  </Form>
);
export default OrderFilters;
