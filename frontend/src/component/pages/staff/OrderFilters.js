import { FloatingLabel, Form } from 'react-bootstrap';

const OrderFilters = ({ tableFilter, setTableFilter, dateFilter, setDateFilter }) => (
  <Form className="staff-order-filters shadow-sm rounded">
    <FloatingLabel controlId="table" label="Số bàn">
      <Form.Control type="input" value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} />
    </FloatingLabel>
    <FloatingLabel controlId="date" label="Ngày">
      <Form.Control type="date" value={dateFilter || ''} onChange={(e) => setDateFilter(e.target.value)} />
    </FloatingLabel>
  </Form>
);
export default OrderFilters;
