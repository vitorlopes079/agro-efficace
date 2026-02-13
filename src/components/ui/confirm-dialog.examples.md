# ConfirmDialog Component - Usage Examples

## Import

```tsx
import { ConfirmDialog } from "@/components/ui";
```

## Basic Usage

### 1. Danger/Delete Confirmation (Red)

```tsx
const [showDialog, setShowDialog] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

const handleDelete = async () => {
  setIsDeleting(true);
  try {
    await deleteItem();
    setShowDialog(false);
  } catch (error) {
    // handle error
  } finally {
    setIsDeleting(false);
  }
};

return (
  <>
    <Button onClick={() => setShowDialog(true)}>Delete</Button>

    <ConfirmDialog
      isOpen={showDialog}
      onClose={() => setShowDialog(false)}
      onConfirm={handleDelete}
      title="Delete Item"
      description="Are you sure you want to delete this item? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      isLoading={isDeleting}
    />
  </>
);
```

### 2. Warning Confirmation (Yellow)

```tsx
<ConfirmDialog
  isOpen={showWarning}
  onClose={() => setShowWarning(false)}
  onConfirm={handleProceed}
  title="Unsaved Changes"
  description="You have unsaved changes. Do you want to leave without saving?"
  confirmText="Leave"
  cancelText="Stay"
  variant="warning"
/>
```

### 3. Info Confirmation (Blue)

```tsx
<ConfirmDialog
  isOpen={showInfo}
  onClose={() => setShowInfo(false)}
  onConfirm={handleConfirm}
  title="Enable Feature"
  description="This feature is currently in beta. Would you like to enable it?"
  confirmText="Enable"
  cancelText="Not Now"
  variant="info"
/>
```

### 4. Success Confirmation (Green)

```tsx
<ConfirmDialog
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  onConfirm={handleNext}
  title="Setup Complete"
  description="Your account has been successfully set up! Click continue to proceed."
  confirmText="Continue"
  cancelText="Close"
  variant="success"
/>
```

## Advanced Usage

### With Custom Description (JSX)

```tsx
<ConfirmDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  onConfirm={handleConfirm}
  title="Delete User"
  description={
    <>
      Are you sure you want to delete <strong>{user.name}</strong>?
      <br />
      <br />
      This will:
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Remove all user data</li>
        <li>Delete associated projects</li>
        <li>Cancel active subscriptions</li>
      </ul>
    </>
  }
  confirmText="Delete User"
  variant="danger"
/>
```

### With Loading State

```tsx
const [isProcessing, setIsProcessing] = useState(false);

const handleConfirm = async () => {
  setIsProcessing(true);
  try {
    await performLongOperation();
    setShowDialog(false);
  } catch (error) {
    // Handle error
  } finally {
    setIsProcessing(false);
  }
};

<ConfirmDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  onConfirm={handleConfirm}
  title="Processing..."
  description="This may take a few moments."
  confirmText="Process"
  variant="info"
  isLoading={isProcessing}
/>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Controls dialog visibility |
| `onClose` | `() => void` | - | Called when dialog should close (ESC, backdrop, X button) |
| `onConfirm` | `() => void` | - | Called when confirm button is clicked |
| `title` | `string` | - | Dialog title |
| `description` | `string \| ReactNode` | - | Dialog description/content |
| `confirmText` | `string` | `"Confirmar"` | Confirm button text |
| `cancelText` | `string` | `"Cancelar"` | Cancel button text |
| `variant` | `"danger" \| "warning" \| "info" \| "success"` | `"danger"` | Visual variant |
| `isLoading` | `boolean` | `false` | Shows loading spinner, disables close |

## Features

- ✅ **Keyboard Support**: ESC key closes dialog (when not loading)
- ✅ **Click Outside**: Clicking backdrop closes dialog (when not loading)
- ✅ **Loading State**: Prevents closing during async operations
- ✅ **Scroll Lock**: Prevents body scroll when dialog is open
- ✅ **Animations**: Smooth fade-in and zoom-in effects
- ✅ **Accessible**: Proper ARIA attributes and focus management
- ✅ **Responsive**: Works on all screen sizes
