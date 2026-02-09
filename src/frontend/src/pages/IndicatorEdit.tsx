import React from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

const IndicatorEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Layout>
      <div>
        <h1>Éditer l'indicateur {id}</h1>
        <p>Fonctionnalité à implémenter</p>
      </div>
    </Layout>
  );
};

export default function IndicatorEdit() {
  return (
    <ProtectedRoute requiredRole="editeur">
      <IndicatorEditContent />
    </ProtectedRoute>
  );
}
