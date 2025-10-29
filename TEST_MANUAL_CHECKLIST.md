# Test Manual Checklist - People Selection Modal

## **A) Backend API Tests**

### ✅ **Basic API Functionality**
- [ ] `GET /api/people/selection?role=actor&limit=100&offset=0` returns 100 items + correct total
- [ ] `GET /api/people/selection?role=director&limit=50&offset=0` returns director data
- [ ] Response format: `{items: [...], total: number, role: string, q: string, limit: number, offset: number}`
- [ ] No 401/403/CORS errors in Network tab
- [ ] Response time < 300ms with proper indexes

### ✅ **Pagination Tests**
- [ ] `offset=0&limit=50` returns first 50 items
- [ ] `offset=50&limit=50` returns next 50 items (no duplicates)
- [ ] `offset=100&limit=50` returns next 50 items
- [ ] Total count is accurate across all pages

### ✅ **Search Tests**
- [ ] `q=peterson` finds "A.C. Peterson"
- [ ] `q=nguyen` finds names with "Nguyễn" (Vietnamese collation)
- [ ] `q=john` finds all Johns (case-insensitive)
- [ ] `q=` (empty) returns all items
- [ ] Search with special characters works

### ✅ **Backward Compatibility**
- [ ] `GET /api/actors/selection` still works (proxy to new endpoint)
- [ ] `GET /api/directors/selection` still works (proxy to new endpoint)
- [ ] Old response format `{success: true, data: [...]}` is handled

## **B) Frontend Modal Tests**

### ✅ **Modal Opening**
- [ ] Click "Thêm" button opens modal
- [ ] Modal shows loading state initially
- [ ] Modal displays first 50 items after loading
- [ ] Progress indicator shows "Đã tải X/Y" correctly

### ✅ **Infinite Scroll Tests**
- [ ] Scroll to bottom triggers automatic loading
- [ ] "Đang tải thêm..." indicator appears
- [ ] New items are appended (no duplicates)
- [ ] Progress indicator updates correctly
- [ ] "Tải thêm" button works as fallback

### ✅ **Search Tests**
- [ ] Type in search box triggers debounced search
- [ ] Search resets pagination (starts from page 1)
- [ ] Search results are filtered correctly
- [ ] Empty search shows all items again
- [ ] Vietnamese search works (nguyen → Nguyễn)

### ✅ **UI/UX Tests**
- [ ] Modal height is max-h-[70vh] (not too small)
- [ ] Scroll is smooth and responsive
- [ ] Loading states are clear and informative
- [ ] Error states show proper messages
- [ ] "Đã hiển thị tất cả X" appears when done

### ✅ **Performance Tests**
- [ ] Large datasets (1000+ items) load smoothly
- [ ] No memory leaks during infinite scroll
- [ ] AbortController cancels requests when closing modal
- [ ] No duplicate API calls during rapid scrolling

## **C) Database Tests**

### ✅ **Index Performance**
- [ ] `CREATE INDEX IX_actors_name ON dbo.actors(name)` exists
- [ ] `CREATE INDEX IX_directors_name ON dbo.directors(name)` exists
- [ ] Queries use proper collation `Vietnamese_CI_AI`
- [ ] No missing names due to JOIN issues

### ✅ **Unicode Support**
- [ ] Vietnamese names display correctly
- [ ] Search works with/without diacritics
- [ ] Special characters in names are preserved
- [ ] No encoding issues in API responses

## **D) Integration Tests**

### ✅ **End-to-End Flow**
- [ ] Open admin panel → Edit movie → Add actor → Modal opens
- [ ] Search for actor → Select actor → Modal closes → Actor added
- [ ] Repeat for directors
- [ ] Large lists (500+ items) work end-to-end

### ✅ **Error Handling**
- [ ] Network errors show fallback to mock data
- [ ] Database errors show proper error messages
- [ ] Invalid API responses are handled gracefully
- [ ] Modal can be closed during loading

## **E) Performance Benchmarks**

### ✅ **Response Times**
- [ ] First page load: < 500ms
- [ ] Subsequent pages: < 300ms
- [ ] Search queries: < 400ms
- [ ] Large datasets (1000+ items): < 1s

### ✅ **Memory Usage**
- [ ] No memory leaks during infinite scroll
- [ ] Large lists don't crash browser
- [ ] AbortController properly cancels requests
- [ ] Modal cleanup works correctly

## **F) Browser Compatibility**

### ✅ **Modern Browsers**
- [ ] Chrome: IntersectionObserver works
- [ ] Firefox: IntersectionObserver works  
- [ ] Safari: IntersectionObserver works
- [ ] Edge: IntersectionObserver works

### ✅ **Mobile Responsiveness**
- [ ] Touch scrolling works smoothly
- [ ] Modal fits mobile screen
- [ ] Search input is accessible
- [ ] Performance is acceptable on mobile

## **G) Security Tests**

### ✅ **API Security**
- [ ] No SQL injection in search queries
- [ ] Proper parameter validation
- [ ] CORS headers are correct
- [ ] No sensitive data exposure

### ✅ **Input Validation**
- [ ] Search queries are sanitized
- [ ] Pagination parameters are validated
- [ ] Role parameter is restricted to actor/director
- [ ] Limit parameter is capped at 200

## **H) Accessibility Tests**

### ✅ **Keyboard Navigation**
- [ ] Tab navigation works in modal
- [ ] Enter key selects items
- [ ] Escape key closes modal
- [ ] Search input is focusable

### ✅ **Screen Reader Support**
- [ ] Loading states are announced
- [ ] Progress indicators are accessible
- [ ] Error messages are announced
- [ ] Modal has proper ARIA labels

---

## **Test Results Summary**

- **Total Tests**: 50+
- **Passed**: ___/50
- **Failed**: ___/50
- **Performance**: ✅/❌
- **Accessibility**: ✅/❌
- **Browser Support**: ✅/❌

## **Notes**

- Test with real database containing 1000+ actors/directors
- Test with Vietnamese names containing diacritics
- Test with special characters and Unicode
- Verify no data loss during pagination
- Confirm smooth infinite scroll experience
