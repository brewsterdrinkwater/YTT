# Walt-Tab Features Guide

## Location Days Counter

Track how many days you've spent in Nashville and NYC each year.

### Where to Find It
**Dashboard → Insights tab** (the 💡 tab)

### What It Shows
- Days in **Nashville** 🎸 with progress bar
- Days in **NYC** 🗽 with progress bar
- Percentage of year in each location
- Number of **missing days** that need tracking

### Missing Days
If you have untracked days, you'll see:
- Red text showing "X days missing"
- A **"Fill in →"** button

Click "Fill in" to go to the Missing Days page where you can quickly set the location for each untracked day.

### How It Resets
The counter automatically resets on **January 1st** each year.

---

## List Sharing

Share your lists with other Walt-Tab users via phone number.

### Setup (One-Time)
1. Go to **Settings** (gear icon in header)
2. Scroll to **Account** section
3. Enter your **phone number** and tap **Save**

This allows others to share lists with you.

### How to Share a List
1. Open the **Grocery List** (Dashboard → Lists tab)
2. Tap the **Share** button (icon with dots and lines)
3. Enter the phone number of the person you want to share with
4. Tap **Share**

### What Shared Users Can Do
- View the list
- Add items to the list
- Delete items from the list
- Mark items as staples

### Revoking Access
1. Open the Share modal on the list
2. Find the person in "Currently shared with"
3. Tap **Remove**

### Status Indicators
- **Connected**: The person has a Walt-Tab account with that phone number
- **Pending**: Waiting for them to add their phone number to their account

---

## Places to Visit + Google Maps

Keep track of places you want to visit and sync them with Google Maps.

### Adding Places
1. Go to **Dashboard → Lists → Places** (📍)
2. Tap **+ Add Place**
3. Enter the place name and location
4. Add a reason why you want to visit
5. Tap **Add to Places List**

### Opening in Google Maps
Each place has an **"Open in Maps"** button that:
- Opens Google Maps with the location
- Lets you get directions
- Lets you save to your personal Google Maps lists

### Saving to Your "Walt-tab" List in Google Maps
1. Tap **"Open in Maps"** on any place
2. In Google Maps, tap **Save** (bookmark icon)
3. Choose or create a list called **"Walt-tab"**
4. Now you can access these places in Google Maps anytime!

### Marking as Visited
- Tap the **location pin icon** on the left of any place to mark it as visited
- Visited places show with green styling and a checkmark
- Tap again to mark as "to visit"

---

## Grocery List Features

### Store Tags
Organize items by store:
- Whole Foods
- Trader Joe's
- Corner Store
- Kroger
- Specialty

### Staple Items
Mark frequently-bought items as staples (star icon):
- Staples persist even after clearing the list
- Automatically reset when you tap "At the Store"

### Shopping Mode
1. Tap **"At the Store"** when you arrive
2. Check off items as you shop
3. Tap **"Store Run Complete"** when done
4. Checked non-staple items are cleared
5. Staples reset for next time

---

## Database Setup (For Developers)

### Sharing Tables
Run the SQL in `supabase/migrations/001_shared_lists.sql` to create:
- `user_profiles` - stores phone numbers
- `shared_lists` - tracks sharing relationships

This enables real-time list sharing between users.
