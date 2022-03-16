import Form from '../../ui/Form';
import Setup from './setup'
import classes from './ssSwap.module.css'

function Swap() {
  return (
    <div className={ classes.newSwapContainer }>
      <Form>
        <Setup />
      </Form>

    </div>
  )
}

export default Swap
