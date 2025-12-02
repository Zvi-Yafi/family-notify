import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should accept and display value', async () => {
    const user = userEvent.setup()
    render(<Input />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test value')
    
    expect(input).toHaveValue('test value')
  })

  it('should call onChange handler', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    
    render(<Input onChange={handleChange} />)
    
    await user.type(screen.getByRole('textbox'), 'a')
    expect(handleChange).toHaveBeenCalled()
  })

  it('should render with placeholder', () => {
    render(<Input placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  it('should render with different input types', () => {
    const { rerender } = render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    
    rerender(<Input type="password" />)
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('should apply custom className', () => {
    render(<Input className="custom-input" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-input')
  })

  it('should forward ref to input element', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('should render with default value', () => {
    render(<Input defaultValue="default text" />)
    expect(screen.getByRole('textbox')).toHaveValue('default text')
  })

  it('should render as controlled component', async () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('')
      return (
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          data-testid="controlled-input"
        />
      )
    }
    
    const user = userEvent.setup()
    render(<TestComponent />)
    
    const input = screen.getByTestId('controlled-input')
    await user.type(input, 'controlled')
    
    expect(input).toHaveValue('controlled')
  })
})


