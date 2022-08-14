import React from 'react';
import Setup from '../../components/migrate/setup';
import { NotConnect } from "../../components/notConnect/index";

export default function Migrate() {
  return (
    <NotConnect
      title="Migrate"
      description="Migrate your LP tokens."
      buttonText="LAUNCH APP"
    >
      <Setup/>
    </NotConnect>
  );
}
