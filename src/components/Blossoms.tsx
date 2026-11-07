export function Blossoms() {
  return (
    <div className="blossoms" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <span className={`flower f${index + 1}`} key={index}>✿</span>
      ))}
    </div>
  );
}
