# Warehouses, Meridian finance and the asset journal

Implemented on the stacked `feat/warehouses-and-finance` branch, following the open-world journal pass. Existing Alpha 2 packets are unchanged. These are playable systems with provisional economic tuning, not a certified long-run balance model.

## Warehouses

Every station, including Meridian, has a **Warehouse** tab. Transfer whole units between the main ship hold and that station's local warehouse.

- Storage is currently **free, unlimited, secure and climate controlled**. Goods do not teleport between stations; retrieve them into your ship and fly them elsewhere.
- Storage preserves existing freshness; it does not rejuvenate spoiled cargo. Retrieval blends freshness with existing onboard goods and requires free hold space and the usual refrigeration/shielding equipment.
- Owned escort cargo must first be handled through the existing cargo/trading systems; these controls move only the main hold.
- Storage is not a purchase, sale, contract delivery or manufacturing conversion. It does not earn credits, reset deadlines or replay mission rewards.
- Acquisition cost is weighted across ship, owned escort cargo and **all warehouses**. Selling the last onboard units does not erase the cost basis of goods still stored elsewhere. Manufacturing, mining and salvage also respect stored holdings.
- Sol City cannot release luxury cargo while the active Greenfields covert assignment prohibits local procurement. Previously held supplies elsewhere remain usable.
- The command deck's NAV panel includes a remote warehouse inventory and station waypoint buttons. Remote inspection is not remote transfer or remote sale.

## Meridian Reserve Bank

A new, independent station at **[200, 0, 420] world coordinates**, with a procedural obsidian-and-gold vault hull, gold map marker and a distinct banking interface. Its representative is **Director Ada Voss**, Custodian of the Meridian Reserve. Her persona uses authored text; no new generated portrait or voice pack is claimed.

Account terminals are available at **Meridian Bank, Sol City and Freeport**. Use **Banking** at the two existing ports, or Meridian's main **Meridian Banking Hall**. Transfers, investment purchases/redemptions and repayments require successful docking at one of those accessible ports. **New loans require visiting Meridian itself.** Other stations provide warehouses, not bank terminals.

### Rates and rules

All rates below are **per simulation minute**, not real-world APR. They freeze with pause, blocking dialogs and hidden tabs. Closing the game does not produce offline interest or investment returns.

| Instrument | Baseline return / charge | Risk |
| --- | --- | --- |
| Savings | +0.10% / sim min | Protected from ship death |
| Meridian reserve bond | +0.15% / sim min | Guaranteed, lower than station-fund expected returns |
| Low-risk station fund | +0.35% expected / sim min, uniform fluctuation ±2% | Can lose value |
| Medium-risk industrial fund | +0.60% expected / sim min, uniform fluctuation ±5% | Larger gains and losses |
| High-risk Hidden Cove fund | +1.00% expected / sim min, uniform fluctuation ±10% | Highest baseline upside and variance |
| Loan | 0.50% / sim min, compounded | A liability, not income |

Station funds mark once each simulation minute. Bank interest and guaranteed bonds are prorated to actual holding/borrowing time, including transactions between market marks. Depositing, borrowing or buying a guaranteed bond just before a minute boundary does not collect a full preceding minute's return.

Closures, hostile ports and fabrication shutdowns subtract **1.5 percentage points** from a station fund's expected minute return while present. The table is the ordinary-condition baseline, not a promise that a disrupted station remains profitable. Fund units are a financial exposure, not ownership/control of station production or a new management simulation.

- Deposit ship cash to savings, or withdraw savings to the ship. Only onboard cash is exposed to the death penalty.
- Investments are funded from savings; redemptions return to savings. A full-holding redemption sells the exact fractional position, so sub-cent dust is not stranded or duplicated.
- Borrow up to **10,000 credits total outstanding principal**. Borrowing creates an equal liability and does not increase NAV or count as journal income.
- Accrued interest is **due every ten simulation minutes**. Repay from onboard cash at any account terminal; withdraw savings first if needed. Payments clear interest before principal.
- Paying all accrued interest renews the next ten-minute interest window. Taking another loan while principal remains outstanding does not postpone that deadline.
- Overdue interest blocks further borrowing and continues accruing. It does not seize savings, auto-debit the ship or lock trading/repayment, so ordinary recovery play remains possible.
- Money inputs accept cents; internal interest, index prices and fractional fund units retain their precision. Displays round amounts, but transfers do not repeatedly round balances into free money.

## Ship defeat

Insurance still restores hull/energy at an accessible port, retains cargo and grants the existing temporary recovery ceasefire. The old capped 1,000-credit charge is **replaced** by losing **exactly 50% of onboard ship credits**, once per defeat.

Savings, investments and warehouses are not charged or liquidated. **Debt also survives defeat**: borrowing, depositing and dying cannot cancel the liability. Normal time-based interest/market changes can still coincide with the recovery tick; those are not a death penalty on the bank account.

## Journal presentation

### Manufacturing

**Chain graph** is the default manufacturing view. It groups actual executable methods into linked, branching production networks: for example **Hydrogen → Refined Fuel → Batteries**, and the two metal branches merging into Machinery.

Method badges support pointer hover, keyboard focus, click and Enter/Space. Tooltips and the selected method panel show supporting stations, the current single-output input ratio, access/equipment requirements and waypoint controls. Single-output ratios are rounded by the runtime; bulk rounding can differ. Alternatives at two stations are not falsely shown as two successive conversions. Missing/unselectable recipes are not invented to fill a chain. A searchable **Recipe list** remains available, with separate passive production and recorded cargo/manufacturing history below.

### Ship & systems

A technical blueprint presents the ship with eight accessible system callouts, installed-state colors, selected-system details, rotation controls and a reduced-motion mode.

- Balanced/high uses the **same three GLB hull families as flight**, automatically rotating with a teal technical material. Larger hull variants use their existing family, not a newly authored unique asset.
- Compatibility/no-WebGL uses a local rotating **procedural SVG technical silhouette**, with no detailed-model download or additional WebGL context.
- Reduced motion disables automatic rotation; manual rotation remains available. Rotation is cosmetic, independent of the simulation clock.
- Callouts represent logical systems; Union credentials and similar upgrades are not falsely represented as separately modelled physical hardware. Unowned systems remain dimmed rather than appearing purchased.

### Command deck net asset value

NAV adds **onboard cash + savings + marked investments + hull + installed upgrades/weapons + ship/owned-escort goods + warehouses − loan principal − accrued interest**.

This is an **estimated equity figure**, not spendable money or a guaranteed liquidation quote:

- Hull uses catalog replacement value adjusted for current hull condition; bundled mining equipment is not counted twice.
- Installed equipment uses catalog costs. Standard acceleration/speed/cargo upgrade steps include the final capped step. Old replaced hulls or removed upgrades are not still owned assets; historical spending is not itself an asset.
- Goods use the median live public sale quote across commodity markets, with a base-sale fallback and recorded freshness adjustment. Uniform valuation across storage locations avoids manufacturing NAV merely by moving a crate into a warehouse. Personal discounts, actual buyer access and final execution can differ.
- Mission documents and temporary convoy ships are not owned assets. Owned escort **cargo** is included.
- Loans are liabilities. Deposits, withdrawals, loan principal and investment purchases/redemptions cannot manufacture net wealth. Paid loan interest is a separate non-trade cash expense; bank returns and portfolio marks are shown in finance/NAV rather than mislabelled trade profit.

The line graph retains **240 observations**, sampled every 30 simulation seconds and on asset transactions/recovery, plus the currently displayed live endpoint. Frequent transactions shorten the retained time window. Negative NAV is supported. No old asset trajectory is fabricated when loading an earlier checkpoint.

## Persistence and verification

The same browser-local **single checkpoint slot** remains in use. New optional finance data has shape, finite-accounting, history-order, station/goods and simulation-clock checks. Loading replaces state without replaying interest, debt, transfers or rewards. Older bank-less worlds gain just the new bank and empty accounts/warehouses at their current simulation time; no money or pre-load interest is invented. Missing original world topology still rejects the save. Older builds should not be used to load these newer worlds.

Verification:

- **230 unit/DOM/integration tests across 22 files**, typechecking and production build.
- **Eight development Chromium tests**, including real buy/store/account/loan/repayment UI, a real lethal projectile and recovery, protected assets, saved finance, NAV, linked recipes, eight system callouts, reduced motion and narrow-window layout. Travel to Meridian, a one-minute finance settlement and the all-upgrades visual example are explicitly arranged fixtures, not earned fresh-save progression.
- **One UI-only production tutorial/checkpoint test**, extended with real deposit/withdrawal, exact wallet accounting, a second save/reload and the banked NAV view. No store imports, position/cargo injection or clock acceleration.
- Inspected desktop/narrow-window screenshots. Separate isolated Chromium renders checked all three detailed hull families and actual automatic rotation without page errors. They are component/visual checks, not full-game GPU performance certification.

Please human-test longer loan/investment sessions, loss/retry fairness, practical warehouse use across ports, political disruptions, valuation clarity, chart/tooltips and detailed-model performance. Rates, the loan cap and free storage are provisional tuning choices; avoid interpreting expected returns as guarantees.
