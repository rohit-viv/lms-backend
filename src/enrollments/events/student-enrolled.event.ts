export class StudentEnrolledEvent {
  constructor(
    public readonly studentId: string,
    public readonly courseId: string,
    public readonly courseTitle: string,
  ) {}
}
