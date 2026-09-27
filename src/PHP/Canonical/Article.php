<?php
namespace Veridis\NewsDesk\Canonical;

defined( 'ABSPATH' ) || exit;

/**
 * Canonical representation of a Veridis Article.
 */
final class Article implements \JsonSerializable {
	public string $uuid;
	public int $wpId;
	public string $title;
	public string $excerpt;
	public string $content;
	public string $wpStatus;
	public ?string $publishedAt;
	public ?string $scheduledAt;
	public string $modifiedAt;
	/** @var array{wpUserId: int, displayName: string}|null */
	public ?array $author;
	/** @var array<int, array{wpTermId: int, name: string, slug: string}> */
	public array $categories;
	/** @var array<int, array{wpTermId: int, name: string, slug: string}> */
	public array $tags;
	/** @var array{wpAttachmentId: int, url: string, alt: string, width: ?int, height: ?int}|null */
	public ?array $featuredImage;
	public ?ArticleEditorial $editorial;
	/** @var array<string, mixed> */
	public array $extensions;

	/**
	 * @param string                                                                                $uuid
	 * @param int                                                                                   $wpId
	 * @param string                                                                                $title
	 * @param string                                                                                $excerpt
	 * @param string                                                                                $content
	 * @param string                                                                                $wpStatus
	 * @param ?string                                                                               $publishedAt
	 * @param ?string                                                                               $scheduledAt
	 * @param string                                                                                $modifiedAt
	 * @param array{wpUserId: int, displayName: string}|null                                        $author
	 * @param array<int, array{wpTermId: int, name: string, slug: string}>                          $categories
	 * @param array<int, array{wpTermId: int, name: string, slug: string}>                          $tags
	 * @param array{wpAttachmentId: int, url: string, alt: string, width: ?int, height: ?int}|null $featuredImage
	 * @param ?ArticleEditorial                                                                     $editorial
	 * @param array<string, mixed>                                                                  $extensions
	 */
	public function __construct(
		string $uuid,
		int $wpId,
		string $title,
		string $excerpt,
		string $content,
		string $wpStatus,
		?string $publishedAt,
		?string $scheduledAt,
		string $modifiedAt,
		?array $author,
		array $categories,
		array $tags,
		?array $featuredImage,
		?ArticleEditorial $editorial,
		array $extensions = array()
	) {
		$this->uuid          = $uuid;
		$this->wpId          = $wpId;
		$this->title         = $title;
		$this->excerpt       = $excerpt;
		$this->content       = $content;
		$this->wpStatus      = $wpStatus;
		$this->publishedAt   = $publishedAt;
		$this->scheduledAt   = $scheduledAt;
		$this->modifiedAt    = $modifiedAt;
		$this->author        = $author;
		$this->categories    = $categories;
		$this->tags          = $tags;
		$this->featuredImage = $featuredImage;
		$this->editorial     = $editorial;
		$this->extensions    = $extensions;
	}

	public function to_array(): array {
		return array(
			'uuid'          => $this->uuid,
			'wpId'          => $this->wpId,
			'title'         => $this->title,
			'excerpt'       => $this->excerpt,
			'content'       => $this->content,
			'wpStatus'      => $this->wpStatus,
			'publishedAt'   => $this->publishedAt,
			'scheduledAt'   => $this->scheduledAt,
			'modifiedAt'    => $this->modifiedAt,
			'author'        => $this->author,
			'categories'    => $this->categories,
			'tags'          => $this->tags,
			'featuredImage' => $this->featuredImage,
			'editorial'     => $this->editorial ? $this->editorial->to_array() : null,
			'extensions'    => $this->extensions,
		);
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize(): array {
		return $this->to_array();
	}
}
