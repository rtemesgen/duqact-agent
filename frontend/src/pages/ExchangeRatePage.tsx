import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { api } from '../api/client';
import type { CurrencyDenomination, CurrencyProfile, ExchangeRate, RoundingRule } from '../api/types';
import { DashboardKPICard } from '../components/DashboardKPICard';
import { Modal } from '../components/Modal';
import { formatDateTime } from '../lib/format';

type Tab = 'profile' | 'denominations' | 'rates';

const blankRate: ExchangeRate = { fromCurrency: '', toCurrency: '', rate: 0 };
const blankProfile: CurrencyProfile = {
  countryName: '',
  countryCode: '',
  currency: '',
  currencyCode: '',
  currencySymbol: '',
  decimalPlaces: 0,
  roundingCondition: 'Nearest',
  upRules: [],
  downRules: [],
  denominations: [],
};

export function ExchangeRatePage() {
  const [tab, setTab] = useState<Tab>('profile');
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [profiles, setProfiles] = useState<CurrencyProfile[]>([]);
  const [rateSearch, setRateSearch] = useState('');
  const [profileSearch, setProfileSearch] = useState('');
  const [editRate, setEditRate] = useState<ExchangeRate | null>(null);
  const [viewRate, setViewRate] = useState<ExchangeRate | null>(null);
  const [deleteRate, setDeleteRate] = useState<ExchangeRate | null>(null);
  const [editProfile, setEditProfile] = useState<CurrencyProfile | null>(null);
  const [viewProfile, setViewProfile] = useState<CurrencyProfile | null>(null);
  const [denomProfile, setDenomProfile] = useState<CurrencyProfile | null>(null);
  const [deleteDenomsTarget, setDeleteDenomsTarget] = useState<CurrencyProfile | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteRemarks, setDeleteRemarks] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'Note' | 'Coin'>('Note');
  const [newStatus, setNewStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editingDenomIndex, setEditingDenomIndex] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [rateData, profileData] = await Promise.all([api.rates(), api.currencyProfiles()]);
      setRates(rateData);
      setProfiles(profileData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Exchange data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRates = useMemo(
    () => rates.filter((item) => `${item.fromCurrency} ${item.toCurrency}`.toLowerCase().includes(rateSearch.toLowerCase())),
    [rates, rateSearch],
  );
  const filteredProfiles = useMemo(
    () =>
      profiles.filter((item) =>
        `${item.countryName} ${item.currency} ${item.currencyCode}`.toLowerCase().includes(profileSearch.toLowerCase()),
      ),
    [profiles, profileSearch],
  );

  async function saveRate() {
    if (!editRate) return;
    setError('');
    setNotice('');
    try {
      await api.saveRate(editRate);
      setEditRate(null);
      setNotice(editRate.id ? 'Exchange rate updated.' : 'Exchange rate created.');
      load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Exchange rate could not be saved.');
    }
  }

  async function saveProfile() {
    if (!editProfile) return;
    setError('');
    setNotice('');
    try {
      await api.saveCurrencyProfile(editProfile);
      setEditProfile(null);
      setNotice(editProfile.id ? 'Currency profile updated.' : 'Currency profile created.');
      load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Currency profile could not be saved.');
    }
  }

  async function saveDenominations() {
    if (!denomProfile) return;
    setError('');
    setNotice('');
    try {
      await api.saveCurrencyProfile(denomProfile);
      setDenomProfile(null);
      setEditingDenomIndex(null);
      setNewValue('');
      setNewLabel('');
      setNotice('Denominations updated.');
      load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Denominations could not be saved.');
    }
  }

  async function confirmDeleteRate() {
    if (!deleteRate) return;
    setError('');
    setNotice('');
    try {
      await api.deleteRate(deleteRate.id!);
      setDeleteRate(null);
      setDeletePassword('');
      setDeleteRemarks('');
      setNotice('Exchange rate deleted.');
      load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Exchange rate could not be deleted.');
    }
  }

  async function clearDenominations() {
    if (!deleteDenomsTarget) return;
    setError('');
    setNotice('');
    try {
      await api.saveCurrencyProfile({ ...deleteDenomsTarget, denominations: [] });
      setDeleteDenomsTarget(null);
      setDeletePassword('');
      setDeleteRemarks('');
      setNotice('Denominations cleared.');
      load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Denominations could not be cleared.');
    }
  }

  function addRule(target: 'upRules' | 'downRules') {
    if (!editProfile) return;
    setEditProfile({ ...editProfile, [target]: [...editProfile[target], { considerFigures: 0, roundTo: 0 }] });
  }

  function updateRule(target: 'upRules' | 'downRules', index: number, key: keyof RoundingRule, value: number) {
    if (!editProfile) return;
    const next = [...editProfile[target]];
    next[index] = { ...next[index], [key]: value };
    setEditProfile({ ...editProfile, [target]: next });
  }

  function removeRule(target: 'upRules' | 'downRules', index: number) {
    if (!editProfile) return;
    setEditProfile({ ...editProfile, [target]: editProfile[target].filter((_, idx) => idx !== index) });
  }

  function addOrUpdateDenomination() {
    if (!denomProfile || !newValue || !newLabel) return;
    const nextItem: CurrencyDenomination = { value: Number(newValue), label: newLabel, type: newType, status: newStatus };
    const next = [...denomProfile.denominations];
    if (editingDenomIndex === null) next.push(nextItem);
    else next[editingDenomIndex] = nextItem;
    next.sort((a, b) => b.value - a.value);
    setDenomProfile({ ...denomProfile, denominations: next });
    setEditingDenomIndex(null);
    setNewValue('');
    setNewLabel('');
    setNewType('Note');
    setNewStatus('Active');
  }

  function editDenomination(index: number) {
    if (!denomProfile) return;
    const item = denomProfile.denominations[index];
    setEditingDenomIndex(index);
    setNewValue(String(item.value));
    setNewLabel(item.label);
    setNewType(item.type);
    setNewStatus(item.status);
  }

  function removeDenomination(index: number) {
    if (!denomProfile) return;
    setDenomProfile({ ...denomProfile, denominations: denomProfile.denominations.filter((_, idx) => idx !== index) });
  }

  const distinctCurrencies = new Set(rates.flatMap((item) => [item.fromCurrency, item.toCurrency]).filter(Boolean)).size;

  return (
    <section className="pageSection">
      <div className="pageHero">
        <div>
          <p className="eyebrow">Agent Operations</p>
          <h1>Exchange Rate</h1>
          <p className="pageLead">This area now supports the reference workflow for currency profiles and denomination management, while keeping persisted exchange rates on the current backend.</p>
        </div>
      </div>

      {notice && <p className="noticeBanner">{notice}</p>}
      {error && <p className="errorBanner">{error}</p>}

      <div className="metricsGrid metricsGrid-four">
        <DashboardKPICard label="Currency Profiles" value={profiles.length} />
        <DashboardKPICard label="Currencies" value={distinctCurrencies} accent="gold" />
        <DashboardKPICard label="Rate Entries" value={rates.length} />
        <DashboardKPICard label="Denominations" value={profiles.reduce((sum, item) => sum + item.denominations.length, 0)} accent="green" />
      </div>

      <section className="surfaceCard">
        {loading ? (
          <div className="surfaceCard surfaceCard-muted"><p className="pageLead">Loading exchange configuration...</p></div>
        ) : (
          <>
        <div className="tabRow">
          <button className={tab === 'profile' ? 'tabButton activeTab' : 'tabButton'} onClick={() => setTab('profile')}>Currency Profiles</button>
          <button className={tab === 'denominations' ? 'tabButton activeTab' : 'tabButton'} onClick={() => setTab('denominations')}>Denominations</button>
          <button className={tab === 'rates' ? 'tabButton activeTab' : 'tabButton'} onClick={() => setTab('rates')}>Exchange Rates</button>
        </div>

        {tab === 'profile' && (
          <>
            <div className="toolbarRow">
              <label className="searchField"><Search size={16} /><input value={profileSearch} onChange={(e) => setProfileSearch(e.target.value)} placeholder="Search country..." /></label>
              <button className="primaryButton" onClick={() => setEditProfile({ ...blankProfile })}><Plus size={18} />Add Profile</button>
            </div>
            <div className="tableWrap desktopOnly">
              <table className="workshopTable">
                <thead><tr><th>Country</th><th>Currency</th><th>Symbol</th><th>Decimals</th><th>Rounding</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredProfiles.map((item) => (
                    <tr key={item.id}>
                      <td><div className="tablePrimaryBlock"><strong>{item.countryName}</strong><span>{item.countryCode}</span></div></td>
                      <td className="accentText">{item.currencyCode} - {item.currency}</td>
                      <td>{item.currencySymbol}</td>
                      <td>{item.decimalPlaces}</td>
                      <td><span className="statusPill statusNeutral">{item.roundingCondition}</span></td>
                      <td><div className="actionRow"><button className="iconButton" onClick={() => setViewProfile(item)}><Eye size={16} /></button><button className="iconButton" onClick={() => setEditProfile(item)}><Pencil size={16} /></button></div></td>
                    </tr>
                  ))}
                  {filteredProfiles.length === 0 && <tr><td colSpan={6} className="emptyCell">No currency profiles found.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mobileOnly">
              {filteredProfiles.length === 0 ? (
                <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No currency profiles found.</p></div>
              ) : (
                <div className="mobileDataList">
                  {filteredProfiles.map((item) => (
                    <article key={item.id} className="mobileDataCard">
                      <div className="mobileDataCardHeader">
                        <div>
                          <strong>{item.countryName}</strong>
                          <span>{item.countryCode}</span>
                        </div>
                        <div className="mobileDataBadgeColumn">
                          <span className="statusPill statusNeutral">{item.roundingCondition}</span>
                        </div>
                      </div>
                      <div className="mobileDataRows">
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Currency</span><span className="mobileDataRowValue">{item.currencyCode} - {item.currency}</span></div>
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Symbol</span><span className="mobileDataRowValue">{item.currencySymbol}</span></div>
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Decimals</span><span className="mobileDataRowValue">{item.decimalPlaces}</span></div>
                      </div>
                      <div className="mobileDataActions">
                        <button className="iconButton" onClick={() => setViewProfile(item)}><Eye size={16} /></button>
                        <button className="iconButton" onClick={() => setEditProfile(item)}><Pencil size={16} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'denominations' && (
          <>
            <div className="toolbarRow">
              <label className="searchField"><Search size={16} /><input value={profileSearch} onChange={(e) => setProfileSearch(e.target.value)} placeholder="Search country..." /></label>
            </div>
            <div className="tableWrap desktopOnly">
              <table className="workshopTable">
                <thead><tr><th>Country</th><th>Currency</th><th>Denominations</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredProfiles.map((item) => (
                    <tr key={item.id}>
                      <td><div className="tablePrimaryBlock"><strong>{item.countryName}</strong><span>{item.countryCode}</span></div></td>
                      <td>{item.currencyCode}</td>
                      <td>{item.denominations.length}</td>
                      <td><div className="actionRow"><button className="iconButton" onClick={() => setDenomProfile(item)}><Eye size={16} /></button><button className="iconButton dangerIcon" onClick={() => setDeleteDenomsTarget(item)}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                  {filteredProfiles.length === 0 && <tr><td colSpan={4} className="emptyCell">No currency profiles found.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mobileOnly">
              {filteredProfiles.length === 0 ? (
                <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No currency profiles found.</p></div>
              ) : (
                <div className="mobileDataList">
                  {filteredProfiles.map((item) => (
                    <article key={item.id} className="mobileDataCard">
                      <div className="mobileDataCardHeader">
                        <div>
                          <strong>{item.countryName}</strong>
                          <span>{item.countryCode}</span>
                        </div>
                        <div className="mobileDataBadgeColumn">
                          <span className="typeBadge">{item.currencyCode}</span>
                        </div>
                      </div>
                      <div className="mobileDataRows">
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Denominations</span><span className="mobileDataRowValue">{item.denominations.length}</span></div>
                      </div>
                      <div className="mobileDataActions">
                        <button className="iconButton" onClick={() => setDenomProfile(item)}><Eye size={16} /></button>
                        <button className="iconButton dangerIcon" onClick={() => setDeleteDenomsTarget(item)}><Trash2 size={16} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'rates' && (
          <>
            <div className="toolbarRow">
              <label className="searchField"><Search size={16} /><input value={rateSearch} onChange={(e) => setRateSearch(e.target.value)} placeholder="Search currency pairs..." /></label>
              <button className="primaryButton" onClick={() => setEditRate(blankRate)}><Plus size={18} />New Rate</button>
            </div>
            <div className="tableWrap desktopOnly">
              <table className="workshopTable">
                <thead><tr><th>Pair</th><th>Rate</th><th>Updated At</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredRates.map((item) => (
                    <tr key={item.id}>
                      <td className="tableStrong">{item.fromCurrency} / {item.toCurrency}</td>
                      <td>{item.rate}</td>
                      <td>{formatDateTime(item.updatedAt ?? null)}</td>
                      <td><div className="actionRow"><button className="iconButton" onClick={() => setViewRate(item)}><Eye size={16} /></button><button className="iconButton" onClick={() => setEditRate(item)}><Pencil size={16} /></button><button className="iconButton dangerIcon" onClick={() => setDeleteRate(item)}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                  {filteredRates.length === 0 && <tr><td colSpan={4} className="emptyCell">No exchange rates found.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mobileOnly">
              {filteredRates.length === 0 ? (
                <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No exchange rates found.</p></div>
              ) : (
                <div className="mobileDataList">
                  {filteredRates.map((item) => (
                    <article key={item.id} className="mobileDataCard">
                      <div className="mobileDataCardHeader">
                        <div>
                          <strong>{item.fromCurrency} / {item.toCurrency}</strong>
                          <span>{formatDateTime(item.updatedAt ?? null)}</span>
                        </div>
                        <div className="mobileDataBadgeColumn">
                          <span className="statusPill statusNeutral">{item.rate}</span>
                        </div>
                      </div>
                      <div className="mobileDataActions">
                        <button className="iconButton" onClick={() => setViewRate(item)}><Eye size={16} /></button>
                        <button className="iconButton" onClick={() => setEditRate(item)}><Pencil size={16} /></button>
                        <button className="iconButton dangerIcon" onClick={() => setDeleteRate(item)}><Trash2 size={16} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
          </>
        )}
      </section>

      {editRate && (
        <Modal title={editRate.id ? 'Edit Exchange Rate' : 'Add Exchange Rate'} onClose={() => setEditRate(null)} onSubmit={(e) => { e.preventDefault(); saveRate(); }} submitLabel={editRate.id ? 'Save Changes' : 'Create Rate'} headerTone="accent">
          <div className="formGrid formGrid-two">
            <label>From Currency<input value={editRate.fromCurrency} onChange={(e) => setEditRate({ ...editRate, fromCurrency: e.target.value.toUpperCase() })} /></label>
            <label>To Currency<input value={editRate.toCurrency} onChange={(e) => setEditRate({ ...editRate, toCurrency: e.target.value.toUpperCase() })} /></label>
            <label>Rate<input type="number" value={editRate.rate} onChange={(e) => setEditRate({ ...editRate, rate: Number(e.target.value) })} /></label>
          </div>
        </Modal>
      )}

      {viewRate && (
        <Modal title="Exchange Rate Details" onClose={() => setViewRate(null)} onSubmit={(e) => { e.preventDefault(); setViewRate(null); }} submitLabel="Close">
          <div className="detailGrid">
            <div className="detailCard"><span>From Currency</span><strong>{viewRate.fromCurrency}</strong></div>
            <div className="detailCard"><span>To Currency</span><strong>{viewRate.toCurrency}</strong></div>
            <div className="detailCard"><span>Rate</span><strong>{viewRate.rate}</strong></div>
            <div className="detailCard"><span>Updated At</span><strong>{formatDateTime(viewRate.updatedAt ?? null)}</strong></div>
          </div>
        </Modal>
      )}

      {editProfile && (
        <Modal title={editProfile.id ? 'Edit Currency Profile' : 'Add Currency Profile'} onClose={() => setEditProfile(null)} onSubmit={(e) => { e.preventDefault(); saveProfile(); }} submitLabel={editProfile.id ? 'Save Profile' : 'Create Profile'} headerTone="accent" size="lg">
          <div className="formGrid formGrid-two">
            <label>Country Name<input value={editProfile.countryName} onChange={(e) => setEditProfile({ ...editProfile, countryName: e.target.value })} /></label>
            <label>Country Code<input value={editProfile.countryCode} onChange={(e) => setEditProfile({ ...editProfile, countryCode: e.target.value.toUpperCase() })} /></label>
            <label>Currency Name<input value={editProfile.currency} onChange={(e) => setEditProfile({ ...editProfile, currency: e.target.value })} /></label>
            <label>Currency Code<input value={editProfile.currencyCode} onChange={(e) => setEditProfile({ ...editProfile, currencyCode: e.target.value.toUpperCase() })} /></label>
            <label>Currency Symbol<input value={editProfile.currencySymbol} onChange={(e) => setEditProfile({ ...editProfile, currencySymbol: e.target.value })} /></label>
            <label>Decimal Places<input type="number" value={editProfile.decimalPlaces} onChange={(e) => setEditProfile({ ...editProfile, decimalPlaces: Number(e.target.value) })} /></label>
            <label>Rounding Mode<select value={editProfile.roundingCondition} onChange={(e) => setEditProfile({ ...editProfile, roundingCondition: e.target.value as CurrencyProfile['roundingCondition'] })}><option value="Nearest">Nearest</option><option value="Round Up">Round Up</option><option value="Round Down">Round Down</option></select></label>
          </div>
          <div className="surfaceCard">
            <div className="surfaceHead"><h2>Round Up Rules</h2><button type="button" className="secondaryButton" onClick={() => addRule('upRules')}>Add Rule</button></div>
            <div className="formGrid">
              {editProfile.upRules.map((rule, index) => (
                <div key={`up-${index}`} className="formGrid formGrid-two">
                  <label>Threshold<input type="number" value={rule.considerFigures} onChange={(e) => updateRule('upRules', index, 'considerFigures', Number(e.target.value))} /></label>
                  <label>Round To<input type="number" value={rule.roundTo} onChange={(e) => updateRule('upRules', index, 'roundTo', Number(e.target.value))} /></label>
                  <button type="button" className="secondaryButton" onClick={() => removeRule('upRules', index)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
          <div className="surfaceCard">
            <div className="surfaceHead"><h2>Round Down Rules</h2><button type="button" className="secondaryButton" onClick={() => addRule('downRules')}>Add Rule</button></div>
            <div className="formGrid">
              {editProfile.downRules.map((rule, index) => (
                <div key={`down-${index}`} className="formGrid formGrid-two">
                  <label>Threshold<input type="number" value={rule.considerFigures} onChange={(e) => updateRule('downRules', index, 'considerFigures', Number(e.target.value))} /></label>
                  <label>Round To<input type="number" value={rule.roundTo} onChange={(e) => updateRule('downRules', index, 'roundTo', Number(e.target.value))} /></label>
                  <button type="button" className="secondaryButton" onClick={() => removeRule('downRules', index)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {viewProfile && (
        <Modal title="Currency Profile Details" onClose={() => setViewProfile(null)} onSubmit={(e) => { e.preventDefault(); setViewProfile(null); }} submitLabel="Close" size="lg">
          <div className="detailGrid">
            <div className="detailCard"><span>Country</span><strong>{viewProfile.countryName}</strong></div>
            <div className="detailCard"><span>Currency</span><strong>{viewProfile.currencyCode} - {viewProfile.currency}</strong></div>
            <div className="detailCard"><span>Symbol</span><strong>{viewProfile.currencySymbol}</strong></div>
            <div className="detailCard"><span>Decimals</span><strong>{viewProfile.decimalPlaces}</strong></div>
            <div className="detailCard"><span>Rounding Mode</span><strong>{viewProfile.roundingCondition}</strong></div>
            <div className="detailCard"><span>Denominations</span><strong>{viewProfile.denominations.length}</strong></div>
          </div>
        </Modal>
      )}

      {denomProfile && (
        <Modal title={`Manage Denominations: ${denomProfile.countryName}`} onClose={() => { setDenomProfile(null); setEditingDenomIndex(null); }} onSubmit={(e) => { e.preventDefault(); saveDenominations(); }} submitLabel="Save Denominations" size="lg">
          <div className="formGrid formGrid-two">
            <label>Value<input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} /></label>
            <label>Label<input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="5,000" /></label>
            <label>Type<select value={newType} onChange={(e) => setNewType(e.target.value as 'Note' | 'Coin')}><option value="Note">Note</option><option value="Coin">Coin</option></select></label>
            <label>Status<select value={newStatus} onChange={(e) => setNewStatus(e.target.value as 'Active' | 'Inactive')}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
          </div>
          <button type="button" className="primaryButton" onClick={addOrUpdateDenomination}>{editingDenomIndex === null ? 'Add Denomination' : 'Update Denomination'}</button>
          <div className="tableWrap desktopOnly">
            <table className="workshopTable">
              <thead><tr><th>Value</th><th>Label</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {denomProfile.denominations.map((item, index) => (
                  <tr key={`${item.value}-${index}`}>
                    <td>{item.value}</td>
                    <td>{item.label}</td>
                    <td><span className="typeBadge">{item.type}</span></td>
                    <td><span className={item.status === 'Active' ? 'statusPill statusPositive' : 'statusPill statusNeutral'}>{item.status}</span></td>
                    <td><div className="actionRow"><button type="button" className="iconButton" onClick={() => editDenomination(index)}><Pencil size={16} /></button><button type="button" className="iconButton dangerIcon" onClick={() => removeDenomination(index)}><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}
                {denomProfile.denominations.length === 0 && <tr><td colSpan={5} className="emptyCell">No denominations recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mobileOnly">
            {denomProfile.denominations.length === 0 ? (
              <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No denominations recorded yet.</p></div>
            ) : (
              <div className="mobileDataList">
                {denomProfile.denominations.map((item, index) => (
                  <article key={`${item.value}-${index}`} className="mobileDataCard">
                    <div className="mobileDataCardHeader">
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                      <div className="mobileDataBadgeColumn">
                        <span className="typeBadge">{item.type}</span>
                        <span className={item.status === 'Active' ? 'statusPill statusPositive' : 'statusPill statusNeutral'}>{item.status}</span>
                      </div>
                    </div>
                    <div className="mobileDataActions">
                      <button type="button" className="iconButton" onClick={() => editDenomination(index)}><Pencil size={16} /></button>
                      <button type="button" className="iconButton dangerIcon" onClick={() => removeDenomination(index)}><Trash2 size={16} /></button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {deleteRate && (
        <Modal title="Delete Exchange Rate" onClose={() => setDeleteRate(null)} onSubmit={(e) => { e.preventDefault(); confirmDeleteRate(); }} submitLabel="Delete Rate" size="lg">
          <div className="formGrid">
            <div className="deleteWarning"><TriangleAlert size={18} /><p>You are deleting <strong>{deleteRate.fromCurrency} / {deleteRate.toCurrency}</strong>.</p></div>
            <label>Remarks<textarea value={deleteRemarks} onChange={(e) => setDeleteRemarks(e.target.value)} /></label>
            <label>Password<input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} /></label>
          </div>
        </Modal>
      )}

      {deleteDenomsTarget && (
        <Modal title="Clear Denominations" onClose={() => setDeleteDenomsTarget(null)} onSubmit={(e) => { e.preventDefault(); clearDenominations(); }} submitLabel="Clear Denominations" size="lg">
          <div className="formGrid">
            <div className="deleteWarning"><TriangleAlert size={18} /><p>You are clearing all denominations for <strong>{deleteDenomsTarget.countryName}</strong>.</p></div>
            <label>Remarks<textarea value={deleteRemarks} onChange={(e) => setDeleteRemarks(e.target.value)} /></label>
            <label>Password<input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} /></label>
          </div>
        </Modal>
      )}
    </section>
  );
}
