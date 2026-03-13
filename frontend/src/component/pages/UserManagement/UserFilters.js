import React from 'react';
import { Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaSearch, FaFilter } from 'react-icons/fa';

const UserFilters = ({ searchTerm, setSearchTerm, filterRole, setFilterRole }) => {
    return (
        <Row className="mb-3">
            <Col md={6} className="mb-2 mb-md-0">
                <InputGroup>
                    <InputGroup.Text>
                        <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                        type="input"
                        placeholder="Tìm kiếm người dùng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </InputGroup>
            </Col>
            <Col md={6}>
                <InputGroup>
                    <InputGroup.Text>
                        <FaFilter />
                    </InputGroup.Text>
                    <Form.Select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        <option value="all">Tất cả các vai trò</option>
                        <option value="user">Chỉ người dùng</option>
                        <option value="admin">Chỉ quản trị viên</option>
                    </Form.Select>
                </InputGroup>
            </Col>
        </Row>
    );
};

export default UserFilters;
