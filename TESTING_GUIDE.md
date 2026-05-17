# Testing Guide for LucasGPT Behavior Fixes

## Prerequisites
- Backend running on http://localhost:4000
- Frontend running on http://localhost:5173
- MongoDB running locally
- Admin account configured in .env

## Test Scenarios

### 1. Static Message Text (NOT as chat bubble)
**Goal**: Verify "Lucas will get back to you in 24 hours or less" is static UI text, not a message.

**Steps**:
1. Open http://localhost:5173 as guest
2. Start a guest session
3. Send a message
4. Check chat window

**Expected**:
- ✅ At top of chat (below header): "Ask Lucas anything" and "Lucas will get back to you in 24 hours or less"
- ✅ After sending message: Small text "Lucas will get back to you soon..." appears below input
- ❌ NO message bubble saying "Lucas will get back to you..."
- ✅ Check MongoDB: `db.messages.find()` should NOT contain this text

**Pass/Fail**: ___

---

### 2. Signed-In User Can Send Messages
**Goal**: Fix "Access denied" bug for signed-in users.

**Steps**:
1. Create account: http://localhost:5173/signup
   - Username: testuser
   - Email: test@example.com
   - Password: testpass123
2. Login with these credentials
3. Start a new conversation
4. Send a message: "Test message from signed-in user"
5. Optional: Attach a test image

**Expected**:
- ✅ Message sends successfully
- ✅ No "Access denied" error
- ✅ Message appears in chat
- ❌ Browser console shows NO 403 errors
- ✅ Backend logs show successful authorization

**Backend logs should show**:
```
Message access check: {
  conversationId: '...',
  userId: '...',
  conversationOwnerId: '...',
  isOwner: true,
  ...
}
```

**Pass/Fail**: ___

---

### 3. User Chat History Sidebar
**Goal**: Registered users see sidebar with their open/answered chats.

**Steps**:
1. Login as testuser (from test 2)
2. Create 3 different conversations by:
   - Sending a message
   - Waiting for the conversation to appear in sidebar
   - Clicking "New Chat" button
   - Repeat
3. Observe the sidebar

**Expected**:
- ✅ Left sidebar visible with all conversations
- ✅ Shows conversation previews (first 50 chars of last message)
- ✅ Shows status badge (open/answered)
- ✅ Shows last update date
- ✅ Active conversation highlighted in blue
- ✅ Can click to switch between conversations
- ✅ "New Chat" button creates new conversation
- ✅ Only open and answered conversations shown

**Pass/Fail**: ___

---

### 4. Guest Conversation Closure
**Goal**: When Lucas closes guest conversation, guest is forced into new session.

**Setup**:
1. Open http://localhost:5173 in incognito window
2. Continue as guest
3. Send message: "Guest test message"
4. Note the conversationId from sessionStorage (F12 > Application > Session Storage)

**Admin Action**:
1. Open http://localhost:5173/admin/login
2. Login as admin
3. Find the guest conversation
4. Click "Close" button

**Back in Guest Window**:
1. Try to send another message
2. Wait 3 seconds for polling update

**Expected**:
- ✅ Guest sees alert: "This conversation has been closed..."
- ✅ Guest is redirected to start screen
- ✅ sessionStorage is cleared (no guestSessionId or conversationId)
- ✅ Old conversation is NOT visible
- ✅ Guest must start new session

**Pass/Fail**: ___

---

### 5. User Conversation Closure
**Goal**: When Lucas closes user conversation, user sees prompt to start new chat.

**Setup**:
1. Login as testuser
2. Send a message in active conversation

**Admin Action**:
1. Admin dashboard > Find testuser's conversation
2. Click "Close" button

**Back in User Window**:
1. Wait for polling update (max 3 seconds)

**Expected**:
- ✅ User sees alert: "This conversation has been closed..."
- ✅ Conversation removed from sidebar
- ✅ User redirected to start screen
- ✅ Closed conversation NOT in sidebar

**Pass/Fail**: ___

---

### 6. Admin Dashboard Status Filters
**Goal**: Admin can filter conversations by status.

**Setup**:
1. Create conversations in different states:
   - 2 open conversations (users sent messages, no admin reply)
   - 2 answered conversations (admin replied)
   - 2 closed conversations (admin clicked close)

**Steps**:
1. Login to admin dashboard
2. Default view shows "Open" tab selected
3. Click "Answered" tab
4. Click "Closed" tab
5. Click "All" tab

**Expected**:
- ✅ "Open" tab: Shows only open conversations (2)
- ✅ "Answered" tab: Shows only answered conversations (2)
- ✅ "Closed" tab: Shows only closed conversations (2)
- ✅ "All" tab: Shows all conversations (6)
- ✅ Tab highlighting works correctly
- ✅ Conversation list updates when switching tabs

**Pass/Fail**: ___

---

### 7. Conversation Status Transitions
**Goal**: Status changes work correctly with automatic transitions.

**Test A - Answering Opens Conversation**:
1. User sends message (status: open)
2. Admin replies (status: answered)
3. Refresh admin dashboard
4. Check status is "answered"

**Expected**: ✅ Status changed to "answered"

**Test B - Follow-up Reopens Conversation**:
1. In answered conversation, user sends follow-up message
2. Refresh admin dashboard
3. Check conversation status

**Expected**: 
- ✅ Status automatically changed back to "open"
- ✅ Conversation appears in "Open" tab
- ✅ Not in "Answered" tab anymore

**Test C - Closing Prevents Messages**:
1. Admin closes a conversation
2. User tries to send message in closed conversation

**Expected**:
- ❌ Message fails with error
- ✅ User sees "This conversation is closed" message
- ✅ User redirected to new chat

**Pass/Fail**: ___

---

### 8. Delete Conversation
**Goal**: Admin can permanently delete conversations.

**Setup**:
1. Create a test conversation with:
   - Multiple messages
   - At least one file upload (image or PDF)

**Steps**:
1. Admin dashboard > Select the test conversation
2. Click "Delete" button
3. Observe confirmation dialog
4. Click "OK" to confirm
5. Check MongoDB: `db.conversations.find()`, `db.messages.find()`, `db.files.find()`

**Expected**:
- ✅ Confirmation dialog appears with warning
- ✅ After confirming, conversation disappears from list
- ✅ Alert shows "Conversation deleted successfully"
- ✅ Conversation document deleted from MongoDB
- ✅ All messages deleted from MongoDB
- ✅ All file metadata deleted from MongoDB
- ✅ All GridFS files deleted (check `db['uploads.files'].find()`)
- ✅ Cannot be recovered

**Pass/Fail**: ___

---

### 9. File Viewing with Blob Authentication
**Goal**: Images display inline, PDFs have open/download buttons, with proper auth.

**Setup**:
1. Create conversation
2. Upload 1 image (JPEG/PNG) and 1 PDF

**Test A - Image Display**:
**Expected**:
- ✅ Image shows inline in message bubble
- ✅ Image loads successfully (not broken)
- ✅ Shows filename below image
- ✅ Click image opens in new tab
- ✅ Network tab shows request with Authorization header (if logged in) or X-Guest-Session-Id header (if guest)

**Test B - PDF Display**:
**Expected**:
- ✅ PDF shows as card with file icon
- ✅ Shows filename and file size (in KB)
- ✅ "Open" button opens PDF in new tab
- ✅ "Download" button downloads with original filename
- ✅ Both buttons work without errors

**Test C - Admin View**:
1. Admin views the same conversation
**Expected**:
- ✅ Admin sees both files correctly
- ✅ Files load with admin JWT token

**Pass/Fail**: ___

---

### 10. Closed Conversation File Access
**Goal**: Users/guests cannot access files in closed conversations, admin can.

**Setup**:
1. Create conversation with uploaded image
2. Note the fileId from MongoDB or network tab
3. Admin closes the conversation

**Test A - User Access (Closed)**:
1. As user, try to access file directly:
   - Copy file URL from network tab before closing
   - Try to access after conversation is closed

**Expected**:
- ❌ File request returns 403 Forbidden
- ❌ Error: "Access denied - conversation is closed"

**Test B - Admin Access (Closed)**:
1. Admin views closed conversation
2. Click on file to view

**Expected**:
- ✅ Admin can still view files
- ✅ No errors

**Pass/Fail**: ___

---

### 11. UI Copy and Layout
**Goal**: Verify correct copy appears in correct locations.

**Steps**:
1. Open main chat page (not logged in)

**Expected Landing Page**:
- ✅ Title: "LucasGPT"
- ✅ Subtitle: "Ask Lucas anything."
- ✅ Text: "Lucas will get back to you in 24 hours or less."
- ✅ Disclaimer: "LucasGPT is answered manually by Lucas, not an AI."

**Expected Chat Window (after starting)**:
- ✅ Header shows "LucasGPT"
- ✅ Below header: Gray bar with "Ask Lucas anything." and "Lucas will get back to you in 24 hours or less."
- ✅ After sending message: Small helper text "Lucas will get back to you soon..."
- ❌ NO message bubble with "Lucas will get back to you..."

**Pass/Fail**: ___

---

### 12. Multiple Concurrent Users
**Goal**: Ensure authorization works for multiple users simultaneously.

**Steps**:
1. Open 3 browser windows:
   - Window A: Guest session
   - Window B: Logged in as user1
   - Window C: Logged in as user2
2. Each sends a message to create conversation
3. Each tries to send message to their own conversation
4. Each tries to view their own uploaded files

**Expected**:
- ✅ Window A: Guest can send messages with X-Guest-Session-Id header
- ✅ Window B: User1 can send messages with JWT token
- ✅ Window C: User2 can send messages with JWT token
- ❌ Users cannot access each other's files
- ✅ Each sees only their own conversations
- ✅ Admin sees all conversations

**Pass/Fail**: ___

---

## MongoDB Verification Queries

### Check conversations don't have the static text as messages:
```javascript
db.messages.find({ content: /Lucas will get back to you/i })
```
**Expected**: Empty result []

### Check conversation statuses:
```javascript
db.conversations.find({}, { status: 1, owner_user_id: 1, is_guest: 1 })
```

### Check closed_at timestamp is set for closed conversations:
```javascript
db.conversations.find({ status: 'closed' }, { status: 1, closed_at: 1 })
```
**Expected**: All closed conversations have closed_at timestamp

### Check file metadata includes message_id:
```javascript
db.files.find({}, { original_name: 1, message_id: 1, conversation_id: 1 })
```
**Expected**: All files have message_id populated

---

## Summary Checklist

- [ ] 1. Static message text (not a bubble)
- [ ] 2. Signed-in users can send messages
- [ ] 3. User chat history sidebar
- [ ] 4. Guest conversation closure
- [ ] 5. User conversation closure
- [ ] 6. Admin status filters
- [ ] 7. Conversation status transitions
- [ ] 8. Delete conversation
- [ ] 9. File viewing with Blob auth
- [ ] 10. Closed conversation file access
- [ ] 11. UI copy and layout
- [ ] 12. Multiple concurrent users

---

## Common Issues and Debugging

### Issue: "Access denied" errors
**Check**:
- Browser console for error details
- Backend logs for authorization messages
- Verify JWT token exists in localStorage (F12 > Application)
- Verify guest session ID exists in sessionStorage

### Issue: Files not displaying
**Check**:
- Network tab shows file requests
- Check for 403/404 errors
- Verify Authorization or X-Guest-Session-Id headers present
- Check backend logs for file access errors

### Issue: Sidebar not showing conversations
**Check**:
- User is logged in (check localStorage for authToken)
- Conversations exist with status 'open' or 'answered'
- MongoDB query: `db.conversations.find({ owner_user_id: ObjectId('...'), status: { $in: ['open', 'answered'] } })`

### Issue: Admin filters not working
**Check**:
- Click different filter tabs
- Check network tab for API request with ?status= parameter
- Verify backend route supports query parameter

---

## Performance Tests

### File Upload Performance:
1. Upload multiple files (5-10 files at once)
2. Observe upload progress
3. Verify all files appear in message

**Expected**:
- ✅ All files uploaded successfully
- ✅ No timeout errors
- ✅ Files appear immediately after upload

### Polling Performance:
1. Leave chat window open for 5 minutes
2. Observe network requests every 3 seconds
3. Check memory usage stays stable

**Expected**:
- ✅ Polling continues reliably
- ✅ No memory leaks
- ✅ Object URLs revoked properly
