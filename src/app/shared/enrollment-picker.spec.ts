import { EnrollmentPicker } from './enrollment-picker';
describe('EnrollmentPicker', () => {
  it('emits a new selection without mutating the parent input', () => {
    const picker = new EnrollmentPicker();
    picker.selected = ['c1'];
    const emit = spyOn(picker.selectedChange, 'emit');
    picker.toggle('c2');
    expect(emit).toHaveBeenCalledWith(['c1', 'c2']);
    expect(picker.selected).toEqual(['c1']);
    picker.toggle('c1');
    expect(emit).toHaveBeenCalledWith([]);
  });
});
