<?php
namespace Veridis\NewsDesk\Canonical;

defined( 'ABSPATH' ) || exit;

/**
 * Canonical representation of Veridis editorial workflow metadata.
 */
final class ArticleEditorial implements \JsonSerializable {
	public ?string $status;
	public ?int $assignedTo;
	public ?string $deadlineAt;
	public ?string $priority;
	public string $internalNotes;
	/** @var array<int, array{id: string, name: string, status: string}> */
	public array $sources;
	/** @var array<string, mixed> */
	public array $extensions;

	/**
	 * @param ?string              $status
	 * @param ?int                 $assignedTo
	 * @param ?string              $deadlineAt
	 * @param ?string              $priority
	 * @param string               $internalNotes
	 * @param array<int, array{id: string, name: string, status: string}> $sources
	 * @param array<string, mixed> $extensions
	 */
	public function __construct(
		?string $status = null,
		?int $assignedTo = null,
		?string $deadlineAt = null,
		?string $priority = null,
		string $internalNotes = '',
		array $sources = array(),
		array $extensions = array()
	) {
		$this->status        = $status;
		$this->assignedTo    = $assignedTo;
		$this->deadlineAt    = $deadlineAt;
		$this->priority      = $priority;
		$this->internalNotes = $internalNotes;
		$this->sources       = $sources;
		$this->extensions    = $extensions;
	}

	public function to_array(): array {
		return array(
			'status'        => $this->status,
			'assignedTo'    => $this->assignedTo,
			'deadlineAt'    => $this->deadlineAt,
			'priority'      => $this->priority,
			'internalNotes' => $this->internalNotes,
			'sources'       => $this->sources,
			'extensions'    => $this->extensions,
		);
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize(): array {
		return $this->to_array();
	}
}
