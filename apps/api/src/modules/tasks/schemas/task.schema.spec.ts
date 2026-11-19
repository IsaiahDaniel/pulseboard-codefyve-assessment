import { TaskPriority, TaskStatus } from './task.schema';

describe('Task enums', () => {
  it('exposes workflow statuses', () => {
    expect(Object.values(TaskStatus)).toEqual(
      expect.arrayContaining([
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
        TaskStatus.BLOCKED,
        TaskStatus.DONE,
      ]),
    );
  });

  it('exposes priorities', () => {
    expect(Object.values(TaskPriority)).toEqual(
      expect.arrayContaining([
        TaskPriority.LOW,
        TaskPriority.MEDIUM,
        TaskPriority.HIGH,
        TaskPriority.URGENT,
      ]),
    );
  });
});
