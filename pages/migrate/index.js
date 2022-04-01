import React from 'react'
import Form from '../../ui/Form';
import Setup from '../../components/migrate/setup'
import classes from './migrate.module.css';

export default function Migrate() {
  return (
    <div className={classes.ffContainer}>
      <div className={classes.newSwapContainer}>
        <Form>
          <Setup />
        </Form>
      </div>
    </div>
  )
}
