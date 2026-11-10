# RGB IR Remote (React Native Stack App)

An Android IR Blaster React Native (Expo + React Navigation Native Stack) app designed to **test**, **map**, and **control** a 20-button RGB Music LED Remote using Android's built-in `ConsumerIrManager`. (Almost every common remotes you find on Amazon, Flipkart and so on...)

## Features

1. **Test & Map Screen (`TestAndMapScreen`)**
   - Preloaded with all 19 NEC IR Hex codes:
     `00F740BF`, `00F7A05F`, `00F7609F`, `00F7E01F`, `00F710EF`, `00F7906F`, `00F750AF`, `00F7D02F`, `00F730CF`, `00F7B04F`, `00F7708F`, `00F7F00F`, `00F708F7`, `00F7C837`, `00F728D7`, `00F7A857`, `00F748B7`, `00F76897`, `00F7E817`
   - **Code List Mode**: Tap **TEST IR** on any hex code to fire the IR blaster at 38kHz, observe what your RGB LED strip does, and tap **MAP** to assign it to the corresponding button on the visual remote picker.
   - **Step-by-Step Guided Wizard Mode**: Fire the active code and tap the matching button on the 4×5 remote layout below to map and auto-advance to the next unmapped code.
   - **20th Button Candidates**: Since the physical remote has 20 buttons (4×5) and 19 codes were listed, includes the remaining 5 codes from the `00F7` NEC 24-key matrix (`00F78877`, `00F700FF`, `00F7807F`, `00F7C03F`, `00F720DF`) plus a custom hex input.

2. **Physical Remote UI Screen (`RemoteScreen`)**
   - Renders the exact 4×5 glossy circular button layout of the physical RGB Music Remote:
     - **Row 1**: `Brightness Up (☀▲)`, `Brightness Down (☀▼)`, `ON`, `OFF`
     - **Row 2**: `RED`, `GREEN`, `BLUE`, `WHITE`
     - **Row 3**: `ORANGE`, `YELLOW`, `CYAN`, `PURPLE`
     - **Row 4**: `JUMP3`, `JUMP7`, `FADE3`, `FADE7`
     - **Row 5**: `♪ 1` (Orange), `♪ 2` (Green), `♪ 3` (Blue), `♪ 4` (Purple)
   - Tapping a mapped button immediately transmits the NEC IR frame with haptic feedback and an animated IR emitter LED at the top of the remote casing.
   - Tapping an unmapped (`?`) button or long-pressing any button opens a quick test-and-assign sheet right on the remote screen.

3. **IR Protocol & Code Table Screen (`SettingsScreen`)**
   - Displays Android `ConsumerIrManager` hardware detection and carrier frequency support.
   - Configurable carrier frequency (`38 kHz` default, `36 kHz`, `40 kHz`, `56 kHz`) and bit order (`MSB-First` default for `00F7xxxx` codes vs `LSB-First`).
   - Live NEC pulse timing inspector and formatted `Hex -> Button` export/import table.

## Running on an Android Phone with an IR Blaster

Because Android's `ConsumerIrManager` requires native Android code (`android.permission.TRANSMIT_IR`), this project includes a self-contained Expo Config Plugin ([`plugins/withIrBlaster.js`](./plugins/withIrBlaster.js)) that automatically generates `IrBlasterModule.kt` and `IrBlasterPackage.kt`.

```bash
# 1. Install dependencies
npm install

# 2. Generate native Android project & run on connected Android phone
npx expo run:android
```
